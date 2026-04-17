pub mod dependency;
pub mod security;
pub mod patterns;
pub mod health;
pub mod blast_radius;

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::github::FileInfo;
use dependency::{extract_dependencies, extract_functions, FunctionDef};
use security::SecurityIssue;
use patterns::Pattern;
use health::{HealthScore, HealthInput};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub path: String,
    pub language: String,
    pub size: usize,
    pub blast_radius: usize,
    pub security_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionInfo {
    pub name: String,
    pub line: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzedFile {
    pub path: String,
    pub language: String,
    pub line_count: usize,
    pub dependencies: Vec<String>,
    pub functions: Vec<FunctionInfo>,
    pub security_count: usize,
    pub blast_radius: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stats {
    pub file_count: usize,
    pub total_lines: usize,
    pub languages: HashMap<String, usize>,
    pub circular_deps: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub files: Vec<AnalyzedFile>,
    pub graph: GraphData,
    pub health_score: HealthScore,
    pub security_issues: Vec<SecurityIssue>,
    pub patterns: Vec<Pattern>,
    pub stats: Stats,
}

pub fn analyze(files: Vec<FileInfo>) -> AnalysisResult {
    let all_paths: Vec<String> = files.iter().map(|f| f.path.clone()).collect();

    // Step 1: extract deps and functions for each file
    let mut dep_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut file_functions: HashMap<String, Vec<FunctionDef>> = HashMap::new();
    let mut file_security: HashMap<String, Vec<SecurityIssue>> = HashMap::new();

    let mut all_security_issues: Vec<SecurityIssue> = Vec::new();

    for file in &files {
        let deps = extract_dependencies(file, &all_paths);
        let resolved_deps: Vec<String> = deps
            .iter()
            .filter_map(|d| d.resolved.clone())
            .collect();
        dep_map.insert(file.path.clone(), resolved_deps);

        let funcs = extract_functions(file);
        file_functions.insert(file.path.clone(), funcs);

        let sec = security::scan_security(file);
        all_security_issues.extend(sec.clone());
        file_security.insert(file.path.clone(), sec);
    }

    // Step 2: blast radius
    let blast_map = blast_radius::calculate_blast_radius(&dep_map);

    // Step 3: circular deps
    let cycles = blast_radius::find_circular_deps(&dep_map);
    let circular_count = cycles.len();

    // Step 4: patterns
    let detected_patterns = patterns::detect_patterns(&files);
    let anti_pattern_count = detected_patterns
        .iter()
        .filter(|p| p.pattern_type == "anti")
        .map(|p| p.files.len())
        .sum::<usize>();

    // Step 5: health score
    let high_sec = all_security_issues.iter().filter(|i| i.severity == "high").count();
    let medium_sec = all_security_issues.iter().filter(|i| i.severity == "medium").count();
    let total_deps: usize = dep_map.values().map(|v| v.len()).sum();

    let health = health::calculate_health(HealthInput {
        circular_deps: circular_count,
        high_security: high_sec,
        medium_security: medium_sec,
        anti_patterns: anti_pattern_count,
        total_files: files.len(),
        total_deps,
    });

    // Step 6: stats
    let mut languages: HashMap<String, usize> = HashMap::new();
    let mut total_lines = 0usize;
    for file in &files {
        *languages.entry(file.language.clone()).or_insert(0) += 1;
        total_lines += file.content.lines().count();
    }
    let stats = Stats {
        file_count: files.len(),
        total_lines,
        languages,
        circular_deps: circular_count,
    };

    // Step 7: build graph
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let mut edge_set = std::collections::HashSet::new();

    for file in &files {
        let sec_count = file_security.get(&file.path).map(|v| v.len()).unwrap_or(0);
        let br = blast_map.get(&file.path).copied().unwrap_or(0);
        nodes.push(GraphNode {
            id: file.path.clone(),
            path: file.path.clone(),
            language: file.language.clone(),
            size: file.content.len(),
            blast_radius: br,
            security_count: sec_count,
        });

        if let Some(deps) = dep_map.get(&file.path) {
            for dep in deps {
                let key = format!("{}→{}", file.path, dep);
                if edge_set.insert(key) {
                    edges.push(GraphEdge {
                        source: file.path.clone(),
                        target: dep.clone(),
                    });
                }
            }
        }
    }

    // Step 8: build AnalyzedFile list
    let analyzed_files: Vec<AnalyzedFile> = files
        .iter()
        .map(|f| {
            let funcs: Vec<FunctionInfo> = file_functions
                .get(&f.path)
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|fd| FunctionInfo { name: fd.name, line: fd.line })
                .collect();
            let deps = dep_map.get(&f.path).cloned().unwrap_or_default();
            let sec_count = file_security.get(&f.path).map(|v| v.len()).unwrap_or(0);
            let br = blast_map.get(&f.path).copied().unwrap_or(0);
            AnalyzedFile {
                path: f.path.clone(),
                language: f.language.clone(),
                line_count: f.content.lines().count(),
                dependencies: deps,
                functions: funcs,
                security_count: sec_count,
                blast_radius: br,
            }
        })
        .collect();

    AnalysisResult {
        files: analyzed_files,
        graph: GraphData { nodes, edges },
        health_score: health,
        security_issues: all_security_issues,
        patterns: detected_patterns,
        stats,
    }
}
