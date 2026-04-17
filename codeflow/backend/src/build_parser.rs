use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::sync::OnceLock;
use regex::Regex;

/// One build target together with the source files that belong to it.
#[derive(Debug, Clone)]
pub struct ParsedTarget {
    pub name: String,
    pub sources: Vec<String>,
    /// True when this target is a GTest / GMock test target.
    pub is_test: bool,
}

// ---------------------------------------------------------------------------
// Include-directive parser (for dependency analysis)
// ---------------------------------------------------------------------------

/// Parse `#include "..."` and `#include <...>` directives from C/C++ source.
/// Returns the raw include paths (e.g. `"foo/bar.h"` or `<vector>`).
pub fn parse_includes(content: &str) -> Vec<String> {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(r#"^\s*#\s*include\s+["<]([^">]+)[">]"#).expect("valid regex")
    });
    content
        .lines()
        .filter_map(|line| re.captures(line).map(|cap| cap[1].to_string()))
        .collect()
}

// ---------------------------------------------------------------------------
// CMake parser
// ---------------------------------------------------------------------------

/// Parse a CMakeLists.txt and return all discovered targets with their sources.
/// `base_dir` is the repo-relative directory that contains the CMakeLists.txt
/// file (empty string for the repo root).
pub fn parse_cmake(content: &str, base_dir: &str) -> Vec<ParsedTarget> {
    let commands = extract_cmake_commands(content);
    let mut variables: HashMap<String, Vec<String>> = HashMap::new();
    let mut targets: Vec<ParsedTarget> = Vec::new();
    // Track targets explicitly identified as GTest targets
    let mut gtest_linked: HashSet<String> = HashSet::new();

    for (cmd_name, args) in &commands {
        match cmd_name.to_lowercase().as_str() {
            "set" => {
                if args.len() >= 2 {
                    // set(VAR_NAME value1 value2 ...)
                    let var_name = args[0].clone();
                    let values = args[1..].to_vec();
                    variables.insert(var_name, values);
                }
            }
            "add_executable" | "add_library" => {
                if let Some((name, sources)) = parse_target_command(args, &variables, base_dir) {
                    merge_target(&mut targets, name, sources);
                }
            }
            "target_sources" => {
                if !args.is_empty() {
                    let name = args[0].clone();
                    let keywords = [
                        "PUBLIC", "PRIVATE", "INTERFACE", "BEFORE",
                    ];
                    let sources: Vec<String> = args[1..]
                        .iter()
                        .filter(|a| !keywords.contains(&a.as_str()))
                        .flat_map(|a| expand_var(a, &variables))
                        .filter(|s| is_source_file(s))
                        .map(|s| resolve_rel_path(&s, base_dir))
                        .collect();
                    merge_target(&mut targets, name, sources);
                }
            }
            "target_link_libraries" => {
                // target_link_libraries(TARGET_NAME [PUBLIC|PRIVATE|INTERFACE] lib1 lib2 ...)
                if !args.is_empty() {
                    let target_name = args[0].clone();
                    let links_gtest = args[1..].iter().any(|a| {
                        let lower = a.to_lowercase();
                        lower == "gtest"
                            || lower == "gtest_main"
                            || lower == "gmock"
                            || lower == "gmock_main"
                            || lower.ends_with("::gtest")
                            || lower.ends_with("::gtest_main")
                            || lower.ends_with("::gmock")
                            || lower.ends_with("::gmock_main")
                    });
                    if links_gtest {
                        gtest_linked.insert(target_name);
                    }
                }
            }
            "gtest_add_tests" | "gtest_discover_tests" => {
                // gtest_discover_tests(TARGET_NAME ...)
                if !args.is_empty() {
                    gtest_linked.insert(args[0].clone());
                }
            }
            _ => {}
        }
    }

    // Mark test targets: either explicitly linked to gtest or named like a test
    for target in &mut targets {
        if gtest_linked.contains(&target.name) || is_cmake_test_name(&target.name) {
            target.is_test = true;
        }
    }

    targets
}

/// Heuristic: target name looks like a C++ test target.
fn is_cmake_test_name(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.ends_with("_test")
        || lower.ends_with("_tests")
        || lower.starts_with("test_")
        || lower == "test"
        || lower.contains("_test_")
        || lower.contains("gtest")
}

fn merge_target(targets: &mut Vec<ParsedTarget>, name: String, sources: Vec<String>) {
    if let Some(t) = targets.iter_mut().find(|t| t.name == name) {
        t.sources.extend(sources);
    } else if !name.is_empty() {
        targets.push(ParsedTarget { name, sources, is_test: false });
    }
}

/// Extract all top-level CMake command invocations as `(command_name, [arg, …])`.
fn extract_cmake_commands(content: &str) -> Vec<(String, Vec<String>)> {
    let content = strip_cmake_comments(content);
    let mut result = Vec::new();
    let mut chars = content.chars().peekable();

    loop {
        // Skip whitespace between commands
        while chars.peek().map(|c: &char| c.is_whitespace()).unwrap_or(false) {
            chars.next();
        }
        if chars.peek().is_none() {
            break;
        }

        // Read command name (alphanumeric + underscores)
        let mut name = String::new();
        while let Some(&c) = chars.peek() {
            if c.is_alphanumeric() || c == '_' {
                name.push(c);
                chars.next();
            } else {
                break;
            }
        }

        // Skip horizontal whitespace until we find '('
        while chars.peek().map(|c: &char| *c == ' ' || *c == '\t').unwrap_or(false) {
            chars.next();
        }

        match chars.peek() {
            Some(&'(') => {
                chars.next(); // consume '('
            }
            Some(&'\n') | None => {
                // End of line without a call – skip
                chars.next();
                continue;
            }
            _ => {
                // Unknown token, skip to next newline
                while chars.peek().map(|c: &char| *c != '\n').unwrap_or(false) {
                    chars.next();
                }
                continue;
            }
        }

        // Collect args until the matching ')'
        let mut args_str = String::new();
        let mut depth = 1usize;
        for c in chars.by_ref() {
            match c {
                '(' => {
                    depth += 1;
                    args_str.push(c);
                }
                ')' => {
                    depth -= 1;
                    if depth == 0 {
                        break;
                    }
                    args_str.push(c);
                }
                _ => args_str.push(c),
            }
        }

        if !name.is_empty() {
            result.push((name, tokenize_cmake_args(&args_str)));
        }
    }

    result
}

/// Remove `#`-style comments from CMake source.
fn strip_cmake_comments(content: &str) -> String {
    let mut result = String::new();
    for line in content.lines() {
        let mut in_quotes = false;
        let mut end = line.len();
        for (i, c) in line.char_indices() {
            match c {
                '"' => in_quotes = !in_quotes,
                '#' if !in_quotes => {
                    end = i;
                    break;
                }
                _ => {}
            }
        }
        result.push_str(&line[..end]);
        result.push('\n');
    }
    result
}

/// Split a CMake argument string into individual tokens, respecting quoted strings.
fn tokenize_cmake_args(args_str: &str) -> Vec<String> {
    let mut args = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;

    for c in args_str.chars() {
        match c {
            '"' => in_quotes = !in_quotes,
            ' ' | '\t' | '\n' | '\r' if !in_quotes => {
                if !current.is_empty() {
                    args.push(current.clone());
                    current.clear();
                }
            }
            _ => current.push(c),
        }
    }
    if !current.is_empty() {
        args.push(current);
    }
    args
}

/// Expand `${VAR}` references; return the original string if not a variable.
fn expand_var(arg: &str, variables: &HashMap<String, Vec<String>>) -> Vec<String> {
    if arg.starts_with("${") && arg.ends_with('}') {
        let var_name = &arg[2..arg.len() - 1];
        if let Some(vals) = variables.get(var_name) {
            return vals.clone();
        }
        return vec![];
    }
    vec![arg.to_string()]
}

/// Return true for source-file extensions we care about.
fn is_source_file(path: &str) -> bool {
    matches!(
        path.split('.').last(),
        Some("cpp") | Some("cc") | Some("cxx") | Some("c")
        | Some("py") | Some("h") | Some("hpp") | Some("hh") | Some("hxx")
        | Some("proto") | Some("java") | Some("go") | Some("rs") | Some("sh")
    )
}

/// Prepend `base_dir` unless the path is already absolute or base_dir is empty.
fn resolve_rel_path(path: &str, base_dir: &str) -> String {
    if path.starts_with('/') || base_dir.is_empty() {
        path.to_string()
    } else {
        format!("{}/{}", base_dir.trim_end_matches('/'), path)
    }
}

/// Parse the args of `add_executable` / `add_library`, returning `(target, sources)`.
fn parse_target_command(
    args: &[String],
    variables: &HashMap<String, Vec<String>>,
    base_dir: &str,
) -> Option<(String, Vec<String>)> {
    if args.is_empty() {
        return None;
    }
    let name = args[0].clone();
    // Keywords that may appear as the second argument in add_library
    let keywords = [
        "STATIC",
        "SHARED",
        "MODULE",
        "OBJECT",
        "INTERFACE",
        "IMPORTED",
        "GLOBAL",
        "ALIAS",
        "WIN32",
        "MACOSX_BUNDLE",
        "EXCLUDE_FROM_ALL",
    ];
    let sources: Vec<String> = args[1..]
        .iter()
        .filter(|a| !keywords.contains(&a.as_str()))
        .flat_map(|a| expand_var(a, variables))
        .filter(|s| is_source_file(s))
        .map(|s| resolve_rel_path(&s, base_dir))
        .collect();
    Some((name, sources))
}

// ---------------------------------------------------------------------------
// Bazel / BUILD parser
// ---------------------------------------------------------------------------

/// Parse a Bazel BUILD or BUILD.bazel file, returning targets with their srcs.
///
/// Uses balanced-paren extraction so that nested calls such as `glob()` and
/// `select()` inside rule bodies are handled correctly, and **any** rule type
/// with a `name = "…"` attribute is recognised – not just a fixed set.
pub fn parse_bazel(content: &str, base_dir: &str) -> Vec<ParsedTarget> {
    let cleaned = strip_bazel_comments(content);
    let chars: Vec<char> = cleaned.chars().collect();
    let len = chars.len();
    let mut pos = 0;
    let mut targets = Vec::new();

    while pos < len {
        // Advance past non-identifier characters (skip stray strings too).
        pos = skip_non_ident(&chars, pos);
        if pos >= len {
            break;
        }

        // Read identifier (e.g. "cc_library", "proto_library", "load", …)
        let (ident, next) = read_ident(&chars, pos);
        pos = next;

        // Skip whitespace between identifier and potential '('
        pos = skip_ws(&chars, pos);

        // Must be followed by '(' to be a call.
        if pos >= len || chars[pos] != '(' {
            continue;
        }

        // Extract the balanced body between '(' and its matching ')'.
        let body_start = pos + 1;
        let close = find_matching_close_paren(&chars, pos);
        if close >= len {
            break; // unmatched – stop
        }
        let body: String = chars[body_start..close].iter().collect();
        pos = close + 1;

        // Skip well-known non-target top-level functions.
        match ident.as_str() {
            "load" | "package" | "exports_files" | "licenses" | "workspace"
            | "register_toolchains" | "register_execution_platforms" => continue,
            _ => {}
        }

        // A target must have `name = "…"`.
        let name = match extract_bazel_string_attr(&body, "name") {
            Some(n) if !n.is_empty() => n,
            _ => continue,
        };

        let is_test = is_bazel_test_rule(&ident, &name);

        // Collect source file paths from `srcs` and `hdrs`.
        let mut sources = extract_bazel_file_list(&body, "srcs", base_dir);
        sources.extend(extract_bazel_file_list(&body, "hdrs", base_dir));

        targets.push(ParsedTarget { name, sources, is_test });
    }

    targets
}

// ---------------------------------------------------------------------------
// Bazel helpers
// ---------------------------------------------------------------------------

fn is_ident_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

/// Advance past characters that are not the start of an identifier.
fn skip_non_ident(chars: &[char], mut pos: usize) -> usize {
    let len = chars.len();
    while pos < len && !is_ident_char(chars[pos]) {
        match chars[pos] {
            '"' => pos = skip_string_lit(chars, pos, '"'),
            '\'' => pos = skip_string_lit(chars, pos, '\''),
            _ => pos += 1,
        }
    }
    pos
}

/// Read a contiguous identifier starting at `pos`. Returns `(identifier, next_pos)`.
fn read_ident(chars: &[char], pos: usize) -> (String, usize) {
    let len = chars.len();
    let mut end = pos;
    while end < len && is_ident_char(chars[end]) {
        end += 1;
    }
    (chars[pos..end].iter().collect(), end)
}

/// Skip ASCII whitespace.
fn skip_ws(chars: &[char], mut pos: usize) -> usize {
    let len = chars.len();
    while pos < len && chars[pos].is_ascii_whitespace() {
        pos += 1;
    }
    pos
}

/// Skip a string literal starting at `pos` (which should be the opening quote).
/// Returns the position **after** the closing quote.
fn skip_string_lit(chars: &[char], pos: usize, quote: char) -> usize {
    let len = chars.len();
    let mut i = pos + 1;
    while i < len && chars[i] != quote {
        if chars[i] == '\\' {
            i += 1; // skip the escaped character
        }
        i += 1;
    }
    if i < len { i + 1 } else { i }
}

/// Find the position of the ')' that matches the '(' at `pos`, handling
/// nested parens and string literals.
fn find_matching_close_paren(chars: &[char], start: usize) -> usize {
    let len = chars.len();
    let mut i = start + 1; // skip opening '('
    let mut depth: usize = 1;
    while i < len && depth > 0 {
        match chars[i] {
            '(' => { depth += 1; i += 1; }
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return i;
                }
                i += 1;
            }
            '"' => i = skip_string_lit(chars, i, '"'),
            '\'' => i = skip_string_lit(chars, i, '\''),
            _ => i += 1,
        }
    }
    i // past end if unmatched
}

/// Strip `#`-style line comments from Bazel/Starlark source (respecting
/// quoted strings).
fn strip_bazel_comments(content: &str) -> String {
    let mut result = String::with_capacity(content.len());
    for line in content.lines() {
        let mut in_double = false;
        let mut in_single = false;
        let mut end = line.len();
        let mut prev = '\0';
        for (i, c) in line.char_indices() {
            if in_double {
                if c == '"' && prev != '\\' { in_double = false; }
            } else if in_single {
                if c == '\'' && prev != '\\' { in_single = false; }
            } else {
                match c {
                    '#' => { end = i; break; }
                    '"' => in_double = true,
                    '\'' => in_single = true,
                    _ => {}
                }
            }
            prev = c;
        }
        result.push_str(&line[..end]);
        result.push('\n');
    }
    result
}

/// Extract the value of a `name = "value"` style string attribute from a
/// Bazel rule body.
fn extract_bazel_string_attr(body: &str, attr: &str) -> Option<String> {
    let re = Regex::new(&format!(r#"\b{}\s*=\s*"([^"]+)""#, regex::escape(attr))).ok()?;
    re.captures(body).map(|c| c[1].to_string())
}

/// Extract source-file paths from a list-valued attribute (`srcs`, `hdrs`).
///
/// Handles `attr = ["f1", "f2"]`, `attr = glob(["*.cc"])`, and mixed
/// expressions.  Bazel labels (`//…`, `@…`, `:…`) and glob wildcards
/// (`*`, `?`) are skipped.
fn extract_bazel_file_list(body: &str, attr: &str, base_dir: &str) -> Vec<String> {
    let attr_re = match Regex::new(&format!(r"\b{}\s*=", regex::escape(attr))) {
        Ok(r) => r,
        Err(_) => return vec![],
    };
    let start = match attr_re.find(body) {
        Some(m) => m.end(),
        None => return vec![],
    };

    // Determine the extent of the value: up to the next top-level attribute
    // assignment (`\n  identifier =`) or end of body.
    let rest = &body[start..];
    let end_re = Regex::new(r"(?m)^\s*[a-zA-Z_]\w*\s*=").expect("valid regex");
    let value_str = match end_re.find(rest) {
        Some(m) => &rest[..m.start()],
        None => rest,
    };

    let file_re = Regex::new(r#""([^"]+)""#).expect("valid regex");
    let mut sources = Vec::new();
    for cap in file_re.captures_iter(value_str) {
        let file = cap[1].trim();
        // Skip Bazel labels and glob wildcards
        if file.starts_with("//") || file.starts_with('@') || file.starts_with(':') {
            continue;
        }
        if file.contains('*') || file.contains('?') {
            continue;
        }
        if is_source_file(file) {
            sources.push(resolve_rel_path(file, base_dir));
        }
    }
    sources
}

/// Determine whether a Bazel rule is a test target.
fn is_bazel_test_rule(rule_type: &str, name: &str) -> bool {
    let lower_rule = rule_type.to_lowercase();
    let lower_name = name.to_lowercase();
    lower_rule.ends_with("_test")
        || lower_rule == "test_suite"
        || lower_name.ends_with("_test")
        || lower_name.ends_with("_tests")
        || lower_name.starts_with("test_")
}

// ---------------------------------------------------------------------------
// Upward include search (for local dependency resolution)
// ---------------------------------------------------------------------------

/// Search for a file by first looking in `start_dir` (relative to `root`),
/// then progressively moving to parent directories up to (and including)
/// `root`.  Returns the repo-relative path (forward-slash separated) if found.
///
/// Both the full `include_path` and its basename are tried at each level so
/// that `#include "sub/foo.h"` can be resolved even when the directory
/// structure doesn't match exactly.
pub fn find_include_upward(root: &Path, start_dir: &str, include_path: &str) -> Option<String> {
    let mut current = if start_dir.is_empty() {
        root.to_path_buf()
    } else {
        root.join(start_dir)
    };

    let basename = include_path.rsplit('/').next().unwrap_or(include_path);

    loop {
        // Try the include path as given (e.g. "sub/foo.h")
        let candidate = current.join(include_path);
        if candidate.is_file() {
            if let Ok(rel) = candidate.strip_prefix(root) {
                return Some(rel.to_string_lossy().replace('\\', "/"));
            }
        }

        // Also try just the basename (e.g. "foo.h")
        if basename != include_path {
            let candidate = current.join(basename);
            if candidate.is_file() {
                if let Ok(rel) = candidate.strip_prefix(root) {
                    return Some(rel.to_string_lossy().replace('\\', "/"));
                }
            }
        }

        // Move to parent directory, stop when we've reached the root
        if current == root.to_path_buf() {
            break;
        }
        current = match current.parent() {
            Some(p) if p.starts_with(root) || p == root => p.to_path_buf(),
            _ => break,
        };
    }

    None
}
