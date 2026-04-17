use std::collections::{HashMap, HashSet, VecDeque};

/// Build reverse dependency map: file -> set of files that import it
pub fn build_reverse_deps(
    deps: &HashMap<String, Vec<String>>,
) -> HashMap<String, HashSet<String>> {
    let mut reverse: HashMap<String, HashSet<String>> = HashMap::new();
    for (file, file_deps) in deps {
        for dep in file_deps {
            reverse
                .entry(dep.clone())
                .or_default()
                .insert(file.clone());
        }
    }
    reverse
}

/// For each file, BFS the reverse dep graph to count transitive dependents
pub fn calculate_blast_radius(
    deps: &HashMap<String, Vec<String>>,
) -> HashMap<String, usize> {
    let reverse = build_reverse_deps(deps);
    let mut result = HashMap::new();

    for file in deps.keys() {
        let count = bfs_count(file, &reverse);
        result.insert(file.clone(), count);
    }

    result
}

fn bfs_count(start: &str, reverse: &HashMap<String, HashSet<String>>) -> usize {
    let mut visited: HashSet<String> = HashSet::new();
    let mut queue: VecDeque<String> = VecDeque::new();
    queue.push_back(start.to_string());

    while let Some(node) = queue.pop_front() {
        if visited.contains(&node) {
            continue;
        }
        visited.insert(node.clone());
        if let Some(dependents) = reverse.get(&node) {
            for dep in dependents {
                if !visited.contains(dep) {
                    queue.push_back(dep.clone());
                }
            }
        }
    }

    // Subtract 1 to exclude the file itself
    visited.len().saturating_sub(1)
}

/// Detect circular dependencies using DFS
pub fn find_circular_deps(deps: &HashMap<String, Vec<String>>) -> Vec<Vec<String>> {
    let mut visited: HashSet<String> = HashSet::new();
    let mut stack: Vec<String> = Vec::new();
    let mut cycles: Vec<Vec<String>> = Vec::new();
    let mut in_stack: HashSet<String> = HashSet::new();

    for node in deps.keys() {
        if !visited.contains(node) {
            dfs(node, deps, &mut visited, &mut in_stack, &mut stack, &mut cycles);
        }
    }

    cycles
}

fn dfs(
    node: &str,
    deps: &HashMap<String, Vec<String>>,
    visited: &mut HashSet<String>,
    in_stack: &mut HashSet<String>,
    stack: &mut Vec<String>,
    cycles: &mut Vec<Vec<String>>,
) {
    visited.insert(node.to_string());
    in_stack.insert(node.to_string());
    stack.push(node.to_string());

    if let Some(neighbors) = deps.get(node) {
        for neighbor in neighbors {
            if !visited.contains(neighbor) {
                dfs(neighbor, deps, visited, in_stack, stack, cycles);
            } else if in_stack.contains(neighbor) {
                // Found a cycle
                let cycle_start = stack.iter().position(|n| n == neighbor).unwrap_or(0);
                let cycle: Vec<String> = stack[cycle_start..].to_vec();
                if cycles.len() < 20 {
                    // Limit cycles reported
                    cycles.push(cycle);
                }
            }
        }
    }

    stack.pop();
    in_stack.remove(node);
}
