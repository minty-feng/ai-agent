use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthScore {
    pub score: u32,
    pub grade: String,
    pub circular_deps: usize,
    pub high_security: usize,
    pub medium_security: usize,
    pub anti_patterns: usize,
    pub avg_coupling: f64,
}

pub struct HealthInput {
    pub circular_deps: usize,
    pub high_security: usize,
    pub medium_security: usize,
    pub anti_patterns: usize,
    pub total_files: usize,
    pub total_deps: usize,
}

pub fn calculate_health(input: HealthInput) -> HealthScore {
    let mut score: i32 = 100;

    score -= (input.circular_deps as i32) * 5;
    score -= (input.high_security as i32) * 2;
    score -= (input.medium_security as i32) * 1;
    score -= (input.anti_patterns as i32) * 3;

    let avg_coupling = if input.total_files > 0 {
        input.total_deps as f64 / input.total_files as f64
    } else {
        0.0
    };

    // Penalize high average coupling
    if avg_coupling > 10.0 {
        score -= ((avg_coupling - 10.0) as i32).min(15);
    }

    let score = score.clamp(0, 100) as u32;

    let grade = match score {
        90..=100 => "A",
        80..=89 => "B",
        70..=79 => "C",
        60..=69 => "D",
        _ => "F",
    }
    .to_string();

    HealthScore {
        score,
        grade,
        circular_deps: input.circular_deps,
        high_security: input.high_security,
        medium_security: input.medium_security,
        anti_patterns: input.anti_patterns,
        avg_coupling,
    }
}
