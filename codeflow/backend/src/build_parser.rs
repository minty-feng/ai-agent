use std::collections::HashMap;
use regex::Regex;

/// One build target together with the source files that belong to it.
#[derive(Debug, Clone)]
pub struct ParsedTarget {
    pub name: String,
    pub sources: Vec<String>,
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

    for (cmd_name, args) in commands {
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
                if let Some((name, sources)) = parse_target_command(&args, &variables, base_dir) {
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
            _ => {}
        }
    }

    targets
}

fn merge_target(targets: &mut Vec<ParsedTarget>, name: String, sources: Vec<String>) {
    if let Some(t) = targets.iter_mut().find(|t| t.name == name) {
        t.sources.extend(sources);
    } else if !name.is_empty() {
        targets.push(ParsedTarget { name, sources });
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
        Some("cpp") | Some("cc") | Some("cxx") | Some("c") | Some("py") | Some("h") | Some("hpp")
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
pub fn parse_bazel(content: &str, base_dir: &str) -> Vec<ParsedTarget> {
    let mut targets = Vec::new();

    // Match common C++/Python rule blocks – capture everything up to the next
    // rule keyword at depth 0.  We use a lazy (?s) dot-all match up to the
    // closing paren of the rule.
    let rule_re = Regex::new(
        r"(?s)\b(cc_binary|cc_library|cc_test|cc_proto_library|py_binary|py_library|py_test)\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)",
    )
    .expect("valid regex");

    for cap in rule_re.captures_iter(content) {
        let body = &cap[2];

        // name = "target_name"
        let name_re = Regex::new(r#"name\s*=\s*"([^"]+)""#).expect("valid regex");
        let name = match name_re.captures(body) {
            Some(c) => c[1].to_string(),
            None => continue,
        };

        // srcs = ["file.cc", "file.py", ...]  or srcs = glob([...])
        let srcs_re = Regex::new(r#"srcs\s*=\s*\[([^\]]*)\]"#).expect("valid regex");
        let mut sources = Vec::new();
        if let Some(srcs_cap) = srcs_re.captures(body) {
            let srcs_content = &srcs_cap[1];
            let file_re = Regex::new(r#""([^":@]+)""#).expect("valid regex");
            for file_cap in file_re.captures_iter(srcs_content) {
                let file = file_cap[1].trim();
                if is_source_file(file) {
                    sources.push(resolve_rel_path(file, base_dir));
                }
            }
        }

        targets.push(ParsedTarget { name, sources });
    }

    targets
}
