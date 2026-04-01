CC      := gcc
CFLAGS  := -Wall -Wextra -std=c11 -g

.PHONY: all clean

all: basic_getopt readline_repl subcommands

basic_getopt: 01_basic_getopt.c
	$(CC) $(CFLAGS) -o $@ $<

# readline_repl requires libreadline; skip gracefully if not available.
readline_repl: 02_readline_repl.c
	$(CC) $(CFLAGS) -o $@ $< -lreadline 2>/dev/null || \
	  echo "  (skipped readline_repl — install libreadline-dev and retry)"

subcommands: 03_subcommands.c
	$(CC) $(CFLAGS) -o $@ $<

clean:
	rm -f basic_getopt readline_repl subcommands
