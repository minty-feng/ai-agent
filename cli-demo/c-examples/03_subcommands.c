/*
 * 03_subcommands.c — Subcommand dispatch pattern (git / docker style)
 *
 * Pattern used by: git, docker, cargo, npm, kubectl, …
 * Demonstrates:
 *   • argv[1] as subcommand name
 *   • Per-subcommand option parsing with getopt
 *   • Help routing (global and per-subcommand)
 *
 * Build:  gcc -o subcommands 03_subcommands.c
 * Usage:
 *   ./subcommands --help
 *   ./subcommands greet --name Alice
 *   ./subcommands count --from 1 --to 5
 *   ./subcommands greet --help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <getopt.h>

/* ── forward declarations ────────────────────────────── */
static int cmd_greet(int argc, char *argv[]);
static int cmd_count(int argc, char *argv[]);

/* ── subcommand registry ─────────────────────────────── */
typedef int (*cmd_fn)(int argc, char *argv[]);

typedef struct {
    const char *name;
    const char *description;
    cmd_fn      fn;
} Subcommand;

static const Subcommand commands[] = {
    { "greet", "print a greeting message",          cmd_greet },
    { "count", "count from --from N to --to M",     cmd_count },
    { NULL, NULL, NULL }
};

static void print_global_help(const char *prog) {
    fprintf(stderr, "Usage: %s <command> [options]\n\nCommands:\n", prog);
    for (int i = 0; commands[i].name; i++)
        fprintf(stderr, "  %-10s  %s\n", commands[i].name, commands[i].description);
    fprintf(stderr, "\nRun '%s <command> --help' for per-command options.\n", prog);
}

/* ── subcommand: greet ───────────────────────────────── */
static int cmd_greet(int argc, char *argv[]) {
    static const struct option opts[] = {
        { "name",  required_argument, NULL, 'n' },
        { "help",  no_argument,       NULL, 'h' },
        { NULL, 0, NULL, 0 }
    };
    const char *name = "World";
    int opt;
    /* Reset getopt state for subcommand parsing */
    optind = 1;
    while ((opt = getopt_long(argc, argv, "n:h", opts, NULL)) != -1) {
        switch (opt) {
        case 'n': name = optarg; break;
        case 'h':
            fprintf(stderr, "Usage: greet [--name NAME]\n"); return 0;
        default:
            fprintf(stderr, "Usage: greet [--name NAME]\n"); return 1;
        }
    }
    printf("Hello, %s!\n", name);
    return 0;
}

/* ── subcommand: count ───────────────────────────────── */
static int cmd_count(int argc, char *argv[]) {
    static const struct option opts[] = {
        { "from", required_argument, NULL, 'f' },
        { "to",   required_argument, NULL, 't' },
        { "help", no_argument,       NULL, 'h' },
        { NULL, 0, NULL, 0 }
    };
    int from = 1, to = 10;
    int opt;
    optind = 1;
    while ((opt = getopt_long(argc, argv, "f:t:h", opts, NULL)) != -1) {
        switch (opt) {
        case 'f': from = atoi(optarg); break;
        case 't': to   = atoi(optarg); break;
        case 'h':
            fprintf(stderr, "Usage: count [--from N] [--to M]\n"); return 0;
        default:
            fprintf(stderr, "Usage: count [--from N] [--to M]\n"); return 1;
        }
    }
    if (from > to) { fprintf(stderr, "error: --from must be <= --to\n"); return 1; }
    for (int i = from; i <= to; i++) printf("%d\n", i);
    return 0;
}

/* ── main dispatcher ─────────────────────────────────── */
int main(int argc, char *argv[]) {
    if (argc < 2) { print_global_help(argv[0]); return 1; }

    /* Handle global --help / -h before subcommand lookup */
    if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
        print_global_help(argv[0]); return 0;
    }

    for (int i = 0; commands[i].name; i++) {
        if (strcmp(argv[1], commands[i].name) == 0) {
            /* Pass the remaining argv to the subcommand (shift by 1) */
            return commands[i].fn(argc - 1, argv + 1);
        }
    }

    fprintf(stderr, "error: unknown command '%s'\n\n", argv[1]);
    print_global_help(argv[0]);
    return 1;
}
