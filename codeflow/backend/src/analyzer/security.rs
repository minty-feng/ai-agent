use regex::Regex;
use serde::{Deserialize, Serialize};
use crate::github::FileInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityIssue {
    pub file: String,
    pub line: usize,
    pub severity: String, // "high" | "medium" | "low"
    pub title: String,
    pub description: String,
    pub code_snippet: String,
}

struct Rule {
    pattern: Regex,
    severity: &'static str,
    title: &'static str,
    description: &'static str,
    skip_test_files: bool,
}

fn build_rules() -> Vec<Rule> {
    vec![
        Rule {
            pattern: Regex::new(r#"(?i)password\s*[=:]\s*["'][^"']{6,}["']"#).unwrap(),
            severity: "high",
            title: "Hardcoded Password",
            description: "A hardcoded password was detected. Use environment variables instead.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"(?i)api[_\-]?key\s*[=:]\s*["'][^"']{8,}["']"#).unwrap(),
            severity: "high",
            title: "Hardcoded API Key",
            description: "A hardcoded API key was detected. Use environment variables instead.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"(?i)secret\s*[=:]\s*["'][^"']{8,}["']"#).unwrap(),
            severity: "high",
            title: "Hardcoded Secret",
            description: "A hardcoded secret was detected. Use environment variables instead.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"AKIA[0-9A-Z]{16}"#).unwrap(),
            severity: "high",
            title: "AWS Access Key",
            description: "An AWS access key ID was detected in source code.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"(?i)token\s*[=:]\s*["'][a-zA-Z0-9_\-\.]{20,}["']"#).unwrap(),
            severity: "high",
            title: "Hardcoded Token",
            description: "A hardcoded token was detected. Use environment variables instead.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"\beval\s*\("#).unwrap(),
            severity: "high",
            title: "Use of eval()",
            description: "eval() can execute arbitrary code and is a security risk.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"\bnew\s+Function\s*\("#).unwrap(),
            severity: "high",
            title: "Dynamic Function Construction",
            description: "new Function() executes dynamic code similar to eval().",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"(?i)execute\s*\(\s*["']?\s*SELECT|INSERT|UPDATE|DELETE.*\+|f["'].*SELECT|INSERT|UPDATE|DELETE"#).unwrap(),
            severity: "high",
            title: "Potential SQL Injection",
            description: "SQL query appears to use string concatenation with variables.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"\bconsole\.(log|debug|warn|error)\s*\("#).unwrap(),
            severity: "low",
            title: "Debug Statement",
            description: "console.log() calls should be removed before production.",
            skip_test_files: true,
        },
        Rule {
            pattern: Regex::new(r#"\bdebugger\b"#).unwrap(),
            severity: "medium",
            title: "Debugger Statement",
            description: "debugger statement found — should be removed before production.",
            skip_test_files: true,
        },
        Rule {
            pattern: Regex::new(r#"(?m)^\s*print\s*\("#).unwrap(),
            severity: "low",
            title: "Debug Print Statement",
            description: "print() calls may expose sensitive data in production.",
            skip_test_files: true,
        },
        Rule {
            pattern: Regex::new(r#"(?i)innerHTML\s*="#).unwrap(),
            severity: "medium",
            title: "innerHTML Assignment",
            description: "Direct innerHTML assignment can lead to XSS vulnerabilities.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"(?i)dangerouslySetInnerHTML"#).unwrap(),
            severity: "medium",
            title: "dangerouslySetInnerHTML",
            description: "Using dangerouslySetInnerHTML can expose your app to XSS attacks.",
            skip_test_files: false,
        },
        Rule {
            pattern: Regex::new(r#"(?i)subprocess\.call|os\.system\s*\("#).unwrap(),
            severity: "high",
            title: "Shell Injection Risk",
            description: "Shell command execution with potential injection vulnerability.",
            skip_test_files: false,
        },
    ]
}

fn is_test_file(path: &str) -> bool {
    path.contains(".test.")
        || path.contains(".spec.")
        || path.contains("__tests__")
        || path.contains("test_")
        || path.ends_with("_test.go")
        || path.ends_with("_test.rs")
}

pub fn scan_security(file: &FileInfo) -> Vec<SecurityIssue> {
    let rules = build_rules();
    let mut issues = Vec::new();
    let test_file = is_test_file(&file.path);

    for rule in &rules {
        if rule.skip_test_files && test_file {
            continue;
        }
        for cap in rule.pattern.captures_iter(&file.content) {
            let match_start = cap.get(0).unwrap().start();
            let line = file.content[..match_start]
                .chars()
                .filter(|&c| c == '\n')
                .count()
                + 1;

            // Get the snippet (the line where the match is)
            let lines: Vec<&str> = file.content.lines().collect();
            let snippet = if line > 0 && line <= lines.len() {
                lines[line - 1].trim().to_string()
            } else {
                cap[0].to_string()
            };

            // Truncate long snippets
            let code_snippet = if snippet.len() > 120 {
                format!("{}...", &snippet[..120])
            } else {
                snippet
            };

            issues.push(SecurityIssue {
                file: file.path.clone(),
                line,
                severity: rule.severity.to_string(),
                title: rule.title.to_string(),
                description: rule.description.to_string(),
                code_snippet,
            });
        }
    }

    issues
}
