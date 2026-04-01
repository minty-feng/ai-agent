/*
 * 01_basic_getopt.c — Classic C CLI argument parsing with getopt_long
 *
 * Pattern used by: git, grep, curl, most Unix utilities.
 * Build:  gcc -o basic_getopt 01_basic_getopt.c
 * Usage:
 *   ./basic_getopt --name Alice --count 3 --verbose
 *   ./basic_getopt -n Bob -c 5 -v
 *   ./basic_getopt --help
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <getopt.h>   /* POSIX extended option parsing */

/* ── option defaults ─────────────────────────────────── */
static const char *g_name    = "World";
static int         g_count   = 1;
static int         g_verbose = 0;

static void print_usage(const char *prog) {
    fprintf(stderr,
        "Usage: %s [OPTIONS]\n\n"
        "Options:\n"
        "  -n, --name    NAME    Name to greet        (default: World)\n"
        "  -c, --count   N       Number of greetings  (default: 1)\n"
        "  -v, --verbose         Enable verbose output\n"
        "  -h, --help            Show this help\n",
        prog);
}

int main(int argc, char *argv[]) {
    /* Long options table: {name, has_arg, flag, val} */
    static const struct option long_opts[] = {
        { "name",    required_argument, NULL, 'n' },
        { "count",   required_argument, NULL, 'c' },
        { "verbose", no_argument,       NULL, 'v' },
        { "help",    no_argument,       NULL, 'h' },
        { NULL, 0, NULL, 0 }   /* sentinel */
    };

    int opt;
    /* getopt_long: short opts "n:c:vh" mirror the long table above */
    while ((opt = getopt_long(argc, argv, "n:c:vh", long_opts, NULL)) != -1) {
        switch (opt) {
        case 'n': g_name    = optarg;       break;
        case 'c': g_count   = atoi(optarg); break;
        case 'v': g_verbose = 1;            break;
        case 'h': print_usage(argv[0]); return 0;
        default:  print_usage(argv[0]); return 1;
        }
    }

    if (g_verbose)
        fprintf(stderr, "[verbose] name=%s  count=%d\n", g_name, g_count);

    for (int i = 0; i < g_count; i++)
        printf("Hello, %s! (greeting %d/%d)\n", g_name, i + 1, g_count);

    return 0;
}
