// Shared type definitions — kept minimal since Commander.js infers option
// types from the .option() / .argument() chain itself (same approach as
// claude-code, which uses @commander-js/extra-typings for full inference).

export type OutputFormat = "text" | "json"
