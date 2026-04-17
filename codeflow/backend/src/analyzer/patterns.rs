use regex::Regex;
use serde::{Deserialize, Serialize};
use crate::github::FileInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    pub name: String,
    pub pattern_type: String, // "good" | "anti"
    pub description: String,
    pub files: Vec<String>,
    pub icon: String,
}

pub fn detect_patterns(files: &[FileInfo]) -> Vec<Pattern> {
    let mut singleton_files = Vec::new();
    let mut factory_files = Vec::new();
    let mut observer_files = Vec::new();
    let mut hook_files = Vec::new();
    let mut god_object_files = Vec::new();
    let mut high_coupling_files: Vec<(String, usize)> = Vec::new();

    let singleton_re = Regex::new(
        r#"(?s)static\s+(?:instance|_instance|getInstance)\b.*?private\s+constructor"#,
    )
    .unwrap();
    let singleton_re2 = Regex::new(r#"getInstance\s*\(\s*\)"#).unwrap();

    let factory_name_re = Regex::new(r#"(?i)(Factory|create[A-Z]\w*|make[A-Z]\w*)\s*[({]"#).unwrap();

    let observer_re = Regex::new(
        r#"\b(addEventListener|removeEventListener|emit|on\s*\(|subscribe\s*\(|unsubscribe\s*\()\b"#,
    )
    .unwrap();

    let hook_re = Regex::new(r#"(?m)^(?:export\s+)?(?:const|function)\s+(use[A-Z]\w*)\s*[=(]"#).unwrap();

    for file in files {
        let line_count = file.content.lines().count();
        let fn_count = count_functions(&file.content, &file.language);

        // Singleton detection
        if singleton_re.is_match(&file.content) || singleton_re2.is_match(&file.content) {
            singleton_files.push(file.path.clone());
        }

        // Factory detection
        if factory_name_re.is_match(&file.content) {
            factory_files.push(file.path.clone());
        }

        // Observer detection
        if observer_re.is_match(&file.content) {
            observer_files.push(file.path.clone());
        }

        // React hooks
        if matches!(file.language.as_str(), "typescript" | "javascript") {
            if file.path.ends_with(".tsx") || file.path.ends_with(".jsx") || file.path.ends_with(".ts") {
                for cap in hook_re.captures_iter(&file.content) {
                    let name = &cap[1];
                    if name != "use" {
                        if !hook_files.contains(&file.path) {
                            hook_files.push(file.path.clone());
                        }
                    }
                }
            }
        }

        // God object anti-pattern
        if line_count > 500 && fn_count >= 10 {
            god_object_files.push(file.path.clone());
        }

        // High coupling (count imports)
        let import_count = count_imports(&file.content, &file.language);
        if import_count >= 10 {
            high_coupling_files.push((file.path.clone(), import_count));
        }
    }

    let mut patterns = Vec::new();

    if !singleton_files.is_empty() {
        patterns.push(Pattern {
            name: "Singleton Pattern".to_string(),
            pattern_type: "good".to_string(),
            description: "Classes with a single shared instance.".to_string(),
            files: singleton_files,
            icon: "🔒".to_string(),
        });
    }

    if !factory_files.is_empty() {
        patterns.push(Pattern {
            name: "Factory Pattern".to_string(),
            pattern_type: "good".to_string(),
            description: "Factory functions or classes for object creation.".to_string(),
            files: factory_files,
            icon: "🏭".to_string(),
        });
    }

    if !observer_files.is_empty() {
        patterns.push(Pattern {
            name: "Observer Pattern".to_string(),
            pattern_type: "good".to_string(),
            description: "Event-driven communication using listeners/emitters.".to_string(),
            files: observer_files,
            icon: "👁️".to_string(),
        });
    }

    if !hook_files.is_empty() {
        patterns.push(Pattern {
            name: "React Custom Hooks".to_string(),
            pattern_type: "good".to_string(),
            description: "Custom React hooks encapsulating reusable stateful logic.".to_string(),
            files: hook_files,
            icon: "🪝".to_string(),
        });
    }

    if !god_object_files.is_empty() {
        patterns.push(Pattern {
            name: "God Object (Anti-pattern)".to_string(),
            pattern_type: "anti".to_string(),
            description: "Files with >500 lines and 10+ functions — consider splitting.".to_string(),
            files: god_object_files,
            icon: "⚠️".to_string(),
        });
    }

    if !high_coupling_files.is_empty() {
        patterns.push(Pattern {
            name: "High Coupling (Anti-pattern)".to_string(),
            pattern_type: "anti".to_string(),
            description: "Files importing 10+ modules — consider reducing dependencies.".to_string(),
            files: high_coupling_files.into_iter().map(|(p, _)| p).collect(),
            icon: "🕸️".to_string(),
        });
    }

    patterns
}

fn count_functions(content: &str, language: &str) -> usize {
    let pat = match language {
        "javascript" | "typescript" => {
            Regex::new(r#"(?m)^(?:export\s+)?(?:async\s+)?function\s+\w+"#).unwrap()
        }
        "python" => Regex::new(r#"(?m)^(?:    )*def\s+\w+"#).unwrap(),
        "go" => Regex::new(r#"(?m)^func\s+"#).unwrap(),
        "rust" => Regex::new(r#"(?m)^(?:pub\s+)?(?:async\s+)?fn\s+\w+"#).unwrap(),
        _ => return 0,
    };
    pat.find_iter(content).count()
}

fn count_imports(content: &str, language: &str) -> usize {
    let pat = match language {
        "javascript" | "typescript" => {
            Regex::new(r#"(?m)^\s*import\s+"#).unwrap()
        }
        "python" => Regex::new(r#"(?m)^(?:from|import)\s+"#).unwrap(),
        "go" => Regex::new(r#""""#).unwrap(),
        "rust" => Regex::new(r#"(?m)^\s*use\s+"#).unwrap(),
        "java" => Regex::new(r#"(?m)^import\s+"#).unwrap(),
        _ => return 0,
    };
    pat.find_iter(content).count()
}
