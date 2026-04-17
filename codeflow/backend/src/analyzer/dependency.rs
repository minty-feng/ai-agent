use regex::Regex;
use crate::github::FileInfo;

#[derive(Debug, Clone)]
pub struct Dependency {
    pub raw: String,
    pub resolved: Option<String>,
    pub is_external: bool,
}

#[derive(Debug, Clone)]
pub struct FunctionDef {
    pub name: String,
    pub line: usize,
}

pub fn extract_dependencies(file: &FileInfo, all_paths: &[String]) -> Vec<Dependency> {
    match file.language.as_str() {
        "javascript" | "typescript" => extract_js_deps(&file.content, &file.path, all_paths),
        "python" => extract_python_deps(&file.content, &file.path, all_paths),
        "go" => extract_go_deps(&file.content, &file.path, all_paths),
        "rust" => extract_rust_deps(&file.content, &file.path, all_paths),
        "java" => extract_java_deps(&file.content, &file.path, all_paths),
        "ruby" => extract_ruby_deps(&file.content, &file.path, all_paths),
        _ => vec![],
    }
}

pub fn extract_functions(file: &FileInfo) -> Vec<FunctionDef> {
    match file.language.as_str() {
        "javascript" | "typescript" => extract_js_functions(&file.content),
        "python" => extract_python_functions(&file.content),
        "go" => extract_go_functions(&file.content),
        "rust" => extract_rust_functions(&file.content),
        "java" => extract_java_functions(&file.content),
        "ruby" => extract_ruby_functions(&file.content),
        _ => vec![],
    }
}

fn resolve_import(raw: &str, file_path: &str, all_paths: &[String]) -> Option<String> {
    if !raw.starts_with('.') {
        return None; // external
    }

    let file_dir = file_path.rfind('/').map(|i| &file_path[..i]).unwrap_or("");
    let joined = if file_dir.is_empty() {
        raw.to_string()
    } else {
        format!("{}/{}", file_dir, raw)
    };

    // Normalize path segments
    let normalized = normalize_path(&joined);

    // Try exact match or with extensions
    let extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".py", "/index.ts", "/index.tsx", "/index.js"];
    for ext in &extensions {
        let candidate = format!("{}{}", normalized, ext);
        if all_paths.iter().any(|p| p == &candidate) {
            return Some(candidate);
        }
    }
    None
}

fn normalize_path(path: &str) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for segment in path.split('/') {
        match segment {
            "." | "" => {}
            ".." => { parts.pop(); }
            s => parts.push(s),
        }
    }
    parts.join("/")
}

fn make_dep(raw: String, file_path: &str, all_paths: &[String]) -> Dependency {
    let resolved = resolve_import(&raw, file_path, all_paths);
    let is_external = !raw.starts_with('.');
    Dependency { raw, resolved, is_external }
}

fn extract_js_deps(content: &str, file_path: &str, all_paths: &[String]) -> Vec<Dependency> {
    let patterns = [
        // import ... from '...'
        Regex::new(r#"(?m)^\s*import\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]"#).unwrap(),
        // import('...')
        Regex::new(r#"import\(['"]([^'"]+)['"]\)"#).unwrap(),
        // require('...')
        Regex::new(r#"require\(['"]([^'"]+)['"]\)"#).unwrap(),
        // export ... from '...'
        Regex::new(r#"(?m)^\s*export\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]"#).unwrap(),
        // side-effect import: import '...'
        Regex::new(r#"(?m)^\s*import\s+['"]([^'"]+)['"]"#).unwrap(),
    ];
    let mut deps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for pat in &patterns {
        for cap in pat.captures_iter(content) {
            let raw = cap[1].to_string();
            if seen.insert(raw.clone()) {
                deps.push(make_dep(raw, file_path, all_paths));
            }
        }
    }
    deps
}

fn extract_python_deps(content: &str, file_path: &str, all_paths: &[String]) -> Vec<Dependency> {
    let patterns = [
        Regex::new(r#"(?m)^from\s+([\w\.]+)\s+import"#).unwrap(),
        Regex::new(r#"(?m)^import\s+([\w\.]+)"#).unwrap(),
    ];
    let mut deps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for pat in &patterns {
        for cap in pat.captures_iter(content) {
            let raw = cap[1].replace('.', "/");
            if seen.insert(raw.clone()) {
                let resolved = resolve_python_import(&raw, file_path, all_paths);
                let is_external = resolved.is_none() && !raw.starts_with('.');
                deps.push(Dependency { raw, resolved, is_external });
            }
        }
    }
    deps
}

fn resolve_python_import(module: &str, file_path: &str, all_paths: &[String]) -> Option<String> {
    let file_dir = file_path.rfind('/').map(|i| &file_path[..i]).unwrap_or("");
    let candidates = [
        format!("{}.py", module),
        format!("{}/{}/__init__.py", file_dir, module),
        format!("{}/__init__.py", module),
    ];
    for c in &candidates {
        if all_paths.iter().any(|p| p == c) {
            return Some(c.clone());
        }
    }
    None
}

fn extract_go_deps(content: &str, file_path: &str, all_paths: &[String]) -> Vec<Dependency> {
    let single = Regex::new(r#"import\s+"([^"]+)""#).unwrap();
    let block = Regex::new(r#"import\s*\(([^)]+)\)"#).unwrap();
    let inner = Regex::new(r#""([^"]+)""#).unwrap();
    let mut deps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for cap in single.captures_iter(content) {
        let raw = cap[1].to_string();
        if seen.insert(raw.clone()) {
            deps.push(make_dep(raw, file_path, all_paths));
        }
    }
    for cap in block.captures_iter(content) {
        for ic in inner.captures_iter(&cap[1]) {
            let raw = ic[1].to_string();
            if seen.insert(raw.clone()) {
                deps.push(make_dep(raw, file_path, all_paths));
            }
        }
    }
    deps
}

fn extract_rust_deps(content: &str, file_path: &str, all_paths: &[String]) -> Vec<Dependency> {
    let use_pat = Regex::new(r#"(?m)^\s*use\s+([\w:]+)"#).unwrap();
    let mod_pat = Regex::new(r#"(?m)^\s*mod\s+(\w+)"#).unwrap();
    let mut deps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for cap in use_pat.captures_iter(content) {
        let raw = cap[1].to_string();
        if seen.insert(raw.clone()) {
            let is_external = !raw.starts_with("crate") && !raw.starts_with("super") && !raw.starts_with("self");
            deps.push(Dependency { raw, resolved: None, is_external });
        }
    }
    for cap in mod_pat.captures_iter(content) {
        let raw = cap[1].to_string();
        if seen.insert(raw.clone()) {
            // Try to resolve to a file
            let file_dir = file_path.rfind('/').map(|i| &file_path[..i]).unwrap_or("");
            let resolved = [
                format!("{}/{}.rs", file_dir, raw),
                format!("{}/{}/mod.rs", file_dir, raw),
            ]
            .iter()
            .find(|c| all_paths.iter().any(|p| p == *c))
            .cloned();
            deps.push(Dependency { raw, resolved, is_external: false });
        }
    }
    deps
}

fn extract_java_deps(content: &str, file_path: &str, all_paths: &[String]) -> Vec<Dependency> {
    let pat = Regex::new(r#"(?m)^import\s+([\w\.]+);"#).unwrap();
    let mut deps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for cap in pat.captures_iter(content) {
        let raw = cap[1].to_string();
        if seen.insert(raw.clone()) {
            let path_version = raw.replace('.', "/") + ".java";
            let resolved = if all_paths.iter().any(|p| p.ends_with(&path_version)) {
                all_paths.iter().find(|p| p.ends_with(&path_version)).cloned()
            } else {
                None
            };
            let is_external = resolved.is_none();
            deps.push(Dependency { raw, resolved, is_external });
        }
    }
    deps
}

fn extract_ruby_deps(content: &str, file_path: &str, all_paths: &[String]) -> Vec<Dependency> {
    let patterns = [
        Regex::new(r#"require_relative\s+['"]([^'"]+)['"]"#).unwrap(),
        Regex::new(r#"require\s+['"]([^'"]+)['"]"#).unwrap(),
    ];
    let mut deps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for pat in &patterns {
        for cap in pat.captures_iter(content) {
            let raw = cap[1].to_string();
            if seen.insert(raw.clone()) {
                deps.push(make_dep(raw, file_path, all_paths));
            }
        }
    }
    deps
}

// --- Function extraction ---

fn extract_js_functions(content: &str) -> Vec<FunctionDef> {
    let patterns = [
        Regex::new(r#"(?m)^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\("#).unwrap(),
        Regex::new(r#"(?m)^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\("#).unwrap(),
        Regex::new(r#"(?m)^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\w+\s*)=>"#).unwrap(),
        Regex::new(r#"^\s+(\w+)\s*\([^)]*\)\s*\{"#).unwrap(),
    ];
    extract_fn_matches(content, &patterns)
}

fn extract_python_functions(content: &str) -> Vec<FunctionDef> {
    let pat = Regex::new(r#"(?m)^(?:    )*def\s+(\w+)\s*\("#).unwrap();
    extract_fn_matches(content, &[pat])
}

fn extract_go_functions(content: &str) -> Vec<FunctionDef> {
    let pat = Regex::new(r#"(?m)^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\("#).unwrap();
    extract_fn_matches(content, &[pat])
}

fn extract_rust_functions(content: &str) -> Vec<FunctionDef> {
    let pat = Regex::new(r#"(?m)^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*[<(]"#).unwrap();
    extract_fn_matches(content, &[pat])
}

fn extract_java_functions(content: &str) -> Vec<FunctionDef> {
    let pat = Regex::new(r#"(?m)^\s+(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\("#).unwrap();
    extract_fn_matches(content, &[pat])
}

fn extract_ruby_functions(content: &str) -> Vec<FunctionDef> {
    let pat = Regex::new(r#"(?m)^\s*def\s+(\w+)"#).unwrap();
    extract_fn_matches(content, &[pat])
}

fn extract_fn_matches(content: &str, patterns: &[Regex]) -> Vec<FunctionDef> {
    let mut funcs = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for pat in patterns {
        for cap in pat.captures_iter(content) {
            let name = cap[1].to_string();
            // Calculate line number
            let match_start = cap.get(0).unwrap().start();
            let line = content[..match_start].chars().filter(|&c| c == '\n').count() + 1;
            if seen.insert((name.clone(), line)) {
                funcs.push(FunctionDef { name, line });
            }
        }
    }
    funcs.sort_by_key(|f| f.line);
    funcs
}
