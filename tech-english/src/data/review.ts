export interface ReviewExercise {
  id: string;
  title: string;
  language: string;
  category: string;
  code: string;
  issues: {
    line: string;
    problem: string;
    suggestion: string;
    exampleComment: string;
  }[];
}

export const reviewData: ReviewExercise[] = [
  {
    id: "sql-injection",
    title: "User Search Endpoint",
    language: "TypeScript",
    category: "Security",
    code: [
      "app.get('/api/users/search', async (req, res) => {",
      "  const { name } = req.query;",
      "  const query = `SELECT * FROM users WHERE name = '${name}'`;",
      "  const result = await db.execute(query);",
      "  res.json(result.rows);",
      "});",
    ].join("\n"),
    issues: [
      {
        line: "Line 3",
        problem:
          "SQL injection vulnerability due to string interpolation of user input",
        suggestion:
          "Use parameterized queries instead of string interpolation",
        exampleComment:
          "Security: This is vulnerable to SQL injection. The `name` query parameter is directly interpolated into the SQL string. An attacker could pass `' OR 1=1 --` to dump the entire users table. Please use a parameterized query: `db.execute('SELECT * FROM users WHERE name = $1', [name])`.",
      },
      {
        line: "Line 2",
        problem: "No input validation on the query parameter",
        suggestion:
          "Validate and sanitize the input before using it",
        exampleComment:
          "Validation: The `name` parameter is used without any validation. Consider adding a check for type, length, and allowed characters before using it in a query.",
      },
      {
        line: "Line 3",
        problem:
          "SELECT * returns all columns, potentially leaking sensitive data",
        suggestion:
          "Explicitly list only the columns needed by the client",
        exampleComment:
          "Suggestion: `SELECT *` may return sensitive columns (email, password_hash, etc.) to the client. Consider selecting only the fields the search UI needs: `SELECT id, name, avatar_url FROM users`.",
      },
    ],
  },
  {
    id: "memory-leak",
    title: "Event Listener in React Component",
    language: "TypeScript (React)",
    category: "Performance",
    code: [
      "function WindowSize() {",
      "  const [size, setSize] = useState({ w: 0, h: 0 });",
      "",
      "  useEffect(() => {",
      "    const handler = () => {",
      "      setSize({ w: window.innerWidth, h: window.innerHeight });",
      "    };",
      "    window.addEventListener('resize', handler);",
      "    // TODO: clean up",
      "  }, []);",
      "",
      "  return <div>{size.w} x {size.h}</div>;",
      "}",
    ].join("\n"),
    issues: [
      {
        line: "Lines 4-10",
        problem:
          "Missing cleanup function in useEffect causes a memory leak",
        suggestion:
          "Return a cleanup function that removes the event listener",
        exampleComment:
          "Memory Leak: The `useEffect` adds a resize event listener but never removes it. When this component unmounts, the listener persists and calls `setSize` on an unmounted component. Please return a cleanup function: `return () => window.removeEventListener('resize', handler);`",
      },
      {
        line: "Lines 5-7",
        problem:
          "The resize handler fires too frequently without throttling",
        suggestion:
          "Add throttling or debouncing to the resize handler",
        exampleComment:
          "Performance: The resize handler fires on every pixel change, which can cause excessive re-renders. Consider debouncing this handler to fire at most every 100-200ms.",
      },
    ],
  },
  {
    id: "race-condition",
    title: "Concurrent Counter Update",
    language: "Go",
    category: "Concurrency",
    code: [
      "package main",
      "",
      "var counter int",
      "",
      "func increment() {",
      "    for i := 0; i < 1000; i++ {",
      "        counter++",
      "    }",
      "}",
      "",
      "func main() {",
      "    go increment()",
      "    go increment()",
      "    time.Sleep(time.Second)",
      '    fmt.Println("Counter:", counter)',
      "}",
    ].join("\n"),
    issues: [
      {
        line: "Line 7",
        problem:
          "Race condition: concurrent goroutines modify shared variable without synchronization",
        suggestion:
          "Use sync.Mutex or sync/atomic to protect the shared counter",
        exampleComment:
          "Race Condition: Two goroutines concurrently increment `counter` without any synchronization. The `counter++` operation is not atomic\u2014it's a read-modify-write sequence that can lose updates. Use `sync/atomic.AddInt64` or protect the critical section with a `sync.Mutex`.",
      },
      {
        line: "Line 14",
        problem:
          "Using time.Sleep for synchronization is fragile and unreliable",
        suggestion:
          "Use sync.WaitGroup to wait for goroutines to complete",
        exampleComment:
          "Synchronization: `time.Sleep(time.Second)` is not a reliable way to wait for goroutines. If the goroutines take longer than 1 second, you'll read a partial result. Use `sync.WaitGroup` instead.",
      },
    ],
  },
  {
    id: "error-handling",
    title: "File Processing Pipeline",
    language: "Python",
    category: "Error Handling",
    code: [
      "def process_files(directory):",
      "    files = os.listdir(directory)",
      "    results = []",
      "    for f in files:",
      "        data = open(os.path.join(directory, f)).read()",
      "        parsed = json.loads(data)",
      "        results.append(transform(parsed))",
      "    return results",
    ].join("\n"),
    issues: [
      {
        line: "Line 5",
        problem: "File handle is never closed; resource leak",
        suggestion:
          "Use a context manager (with statement) to ensure the file is properly closed",
        exampleComment:
          "Resource Leak: `open(...).read()` opens a file but never closes it. In a loop processing many files, this can exhaust file descriptors. Use a context manager: `with open(path) as fh: data = fh.read()`.",
      },
      {
        line: "Lines 5-7",
        problem:
          "No error handling for file I/O or JSON parsing failures",
        suggestion:
          "Wrap operations in try/except and handle or log individual file failures",
        exampleComment:
          "Error Handling: If any single file is unreadable or contains invalid JSON, the entire function fails. Consider wrapping the loop body in try/except to handle individual file failures gracefully and continue processing the rest.",
      },
      {
        line: "Line 1",
        problem: "No type hints on the function signature",
        suggestion:
          "Add type hints for parameters and return value",
        exampleComment:
          "Type Hints: Consider adding type annotations for better IDE support and documentation: `def process_files(directory: str) -> list[dict]:`.",
      },
    ],
  },
];
