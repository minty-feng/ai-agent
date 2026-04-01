/*
 * 02_readline_repl.c — Interactive REPL using GNU readline
 *
 * Pattern used by: bash, python, sqlite3, gdb.
 * Features demonstrated:
 *   • readline() for line editing & Ctrl-D / EOF handling
 *   • add_history() for arrow-key history
 *   • Built-in slash-commands (/help, /exit, /history)
 *
 * Build:  gcc -o readline_repl 02_readline_repl.c -lreadline
 * Usage:  ./readline_repl
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <readline/readline.h>
#include <readline/history.h>

#define MAX_HISTORY 100

/* ── built-in command handlers ───────────────────────── */
static void cmd_help(void) {
    printf("Built-in commands:\n"
           "  /help     — show this message\n"
           "  /history  — print command history\n"
           "  /clear    — clear the screen\n"
           "  /exit     — quit (also Ctrl-D)\n");
}

static void cmd_history(void) {
    HIST_ENTRY **hist = history_list();
    if (!hist) { printf("(no history)\n"); return; }
    for (int i = 0; hist[i]; i++)
        printf("  %3d  %s\n", i + 1, hist[i]->line);
}

static int handle_builtin(const char *line) {
    if (strcmp(line, "/help")    == 0) { cmd_help();    return 1; }
    if (strcmp(line, "/history") == 0) { cmd_history(); return 1; }
    if (strcmp(line, "/clear")   == 0) { system("clear"); return 1; }
    if (strcmp(line, "/exit")    == 0 ||
        strcmp(line, "/quit")    == 0)   return -1;  /* signal exit */
    return 0;  /* not a built-in */
}

/* ── stub "AI" response ──────────────────────────────── */
static void process_input(const char *line) {
    /* In a real tool you would call an API here */
    printf("  → Echo: \"%s\"  (stub — wire up your API)\n", line);
}

int main(void) {
    printf("readline-repl demo — type /help for commands, Ctrl-D to exit\n\n");

    using_history();

    while (1) {
        char *line = readline("repl> ");  /* allocates; NULL == EOF */
        if (!line) {
            printf("\n");
            break;
        }

        /* skip blank lines */
        if (*line == '\0') { free(line); continue; }

        /* save to readline history */
        add_history(line);

        /* dispatch built-ins */
        int rc = handle_builtin(line);
        if (rc < 0) { free(line); break; }   /* /exit */
        if (rc > 0) { free(line); continue; } /* handled */

        /* normal input */
        process_input(line);
        free(line);
    }

    printf("Bye!\n");
    return 0;
}
