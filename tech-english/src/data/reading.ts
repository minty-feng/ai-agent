export interface ReadingPassage {
  id: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  passage: string;
  questions: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }[];
}

export const readingData: ReadingPassage[] = [
  {
    id: "algo-big-o",
    title: "Understanding Big-O Notation",
    category: "Algorithms",
    difficulty: "Beginner",
    passage:
      "Big-O notation is the language we use to describe the performance or complexity of an algorithm. It specifically describes the worst-case scenario and can be used to describe the execution time or space used by an algorithm.\n\nO(1) describes an algorithm that will always execute in the same time regardless of the size of the input data set. An example is accessing an array element by index.\n\nO(n) describes an algorithm whose performance will grow linearly and in direct proportion to the size of the input data set. A simple for loop iterating through an array is O(n).\n\nO(n\u00b2) represents an algorithm whose performance is directly proportional to the square of the size of the input data set. This is common with algorithms that involve nested iterations over the data set. Bubble sort is a classic example.\n\nO(log n) describes an algorithm that reduces the problem size by half with each step, such as binary search. This is significantly more efficient than O(n) for large data sets because the number of operations grows very slowly relative to the input size.\n\nWhen analyzing algorithms, we typically focus on the dominant term and drop constants. For example, O(2n + 5) simplifies to O(n) because as n approaches infinity, the constant factors become insignificant.",
    questions: [
      {
        question: "What does Big-O notation specifically describe?",
        options: [
          "The best-case scenario of an algorithm",
          "The worst-case scenario of an algorithm",
          "The average-case scenario of an algorithm",
          "The memory allocation of an algorithm",
        ],
        answer: 1,
        explanation:
          "The passage states: 'It specifically describes the worst-case scenario and can be used to describe the execution time or space used by an algorithm.'",
      },
      {
        question: "Which time complexity does binary search have?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n\u00b2)"],
        answer: 2,
        explanation:
          "The passage mentions: 'O(log n) describes an algorithm that reduces the problem size by half with each step, such as binary search.'",
      },
      {
        question: "Why do we drop constants in Big-O analysis?",
        options: [
          "Constants make the notation harder to read",
          "Constants are always equal to 1",
          "As n approaches infinity, constant factors become insignificant",
          "Dropping constants makes the algorithm faster",
        ],
        answer: 2,
        explanation:
          "The passage explains: 'as n approaches infinity, the constant factors become insignificant.'",
      },
    ],
  },
  {
    id: "os-virtual-memory",
    title: "How Virtual Memory Works",
    category: "Operating Systems",
    difficulty: "Intermediate",
    passage:
      "Virtual memory is a memory management technique that creates an illusion for users of a very large main memory. The operating system manages virtual address spaces and the assignment of real memory to virtual memory. Address translation hardware in the CPU, often referred to as a memory management unit (MMU), automatically translates virtual addresses to physical addresses.\n\nThe primary benefit of virtual memory is that it frees application programmers from having to manage shared memory space. It also provides memory protection because each process runs in its own virtual address space, preventing one process from corrupting the memory of another.\n\nWhen a process references a page that is not currently in physical memory, a page fault occurs. The OS must then load the required page from disk (swap space) into an available page frame in RAM. If no frames are available, a page replacement algorithm\u2014such as LRU (Least Recently Used) or Clock\u2014selects a victim page to evict.\n\nThe Translation Lookaside Buffer (TLB) is a specialized cache that stores recent virtual-to-physical address translations. TLB hits avoid the overhead of walking the page table, which is crucial for performance since memory accesses happen billions of times per second. A TLB miss triggers a page table walk, adding several cycles of latency.\n\nThrashing occurs when the system spends more time swapping pages than executing processes, typically when working set sizes exceed physical memory. This can be mitigated by increasing RAM, reducing the number of concurrent processes, or improving locality of reference in applications.",
    questions: [
      {
        question:
          "What hardware component translates virtual addresses to physical addresses?",
        options: [
          "The ALU (Arithmetic Logic Unit)",
          "The MMU (Memory Management Unit)",
          "The GPU (Graphics Processing Unit)",
          "The FPU (Floating Point Unit)",
        ],
        answer: 1,
        explanation:
          "The passage states: 'Address translation hardware in the CPU, often referred to as a memory management unit (MMU), automatically translates virtual addresses to physical addresses.'",
      },
      {
        question:
          "What happens when a process references a page not in physical memory?",
        options: [
          "The process is terminated",
          "A segmentation fault occurs",
          "A page fault occurs",
          "The virtual address is discarded",
        ],
        answer: 2,
        explanation:
          "The passage explains: 'When a process references a page that is not currently in physical memory, a page fault occurs.'",
      },
      {
        question: "What is thrashing?",
        options: [
          "When the CPU overheats during computation",
          "When too many threads compete for a lock",
          "When the system spends more time swapping pages than executing processes",
          "When disk I/O exceeds the bus bandwidth",
        ],
        answer: 2,
        explanation:
          "The passage defines thrashing as when 'the system spends more time swapping pages than executing processes.'",
      },
    ],
  },
  {
    id: "ai-transformers",
    title: "The Transformer Architecture",
    category: "AI & Machine Learning",
    difficulty: "Advanced",
    passage:
      'The Transformer architecture, introduced in the landmark 2017 paper "Attention Is All You Need," fundamentally changed natural language processing by eliminating the need for recurrent or convolutional layers entirely. Instead, it relies solely on attention mechanisms to draw global dependencies between input and output.\n\nAt the core of the Transformer is the self-attention mechanism, which computes attention scores between all pairs of positions in a sequence. For each position, the model creates three vectors: a Query (Q), a Key (K), and a Value (V). The attention output is computed as: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V, where d_k is the dimension of the key vectors. The scaling factor sqrt(d_k) prevents the dot products from growing too large, which would push the softmax into regions with extremely small gradients.\n\nMulti-head attention extends this by running several attention operations in parallel, allowing the model to jointly attend to information from different representation subspaces. Each head operates on a projected, lower-dimensional version of Q, K, and V, and the outputs are concatenated and linearly transformed.\n\nThe encoder-decoder structure uses stacked layers of self-attention and feedforward networks. The encoder processes the input sequence in parallel (unlike RNNs which process sequentially), while the decoder generates the output auto-regressively, using masked self-attention to prevent positions from attending to subsequent positions.\n\nModern large language models like GPT use only the decoder portion with causal (left-to-right) masking, while BERT uses only the encoder with bidirectional attention. This architectural flexibility is one reason Transformers have become the foundation of nearly all state-of-the-art NLP models.',
    questions: [
      {
        question:
          "Why is the scaling factor sqrt(d_k) used in the attention formula?",
        options: [
          "To normalize the output vectors",
          "To reduce memory usage during training",
          "To prevent dot products from pushing softmax into small-gradient regions",
          "To increase the learning rate during backpropagation",
        ],
        answer: 2,
        explanation:
          "The passage explains: 'The scaling factor sqrt(d_k) prevents the dot products from growing too large, which would push the softmax into regions with extremely small gradients.'",
      },
      {
        question:
          "How does the Transformer encoder differ from RNNs in processing?",
        options: [
          "The encoder uses more memory than RNNs",
          "The encoder processes input sequences in parallel",
          "The encoder uses convolutional layers",
          "The encoder is slower but more accurate",
        ],
        answer: 1,
        explanation:
          "The passage states: 'The encoder processes the input sequence in parallel (unlike RNNs which process sequentially).'",
      },
      {
        question:
          "What is the key architectural difference between GPT and BERT?",
        options: [
          "GPT is larger than BERT",
          "GPT uses the encoder, BERT uses the decoder",
          "GPT uses the decoder with causal masking, BERT uses the encoder with bidirectional attention",
          "GPT uses convolutional layers while BERT uses attention",
        ],
        answer: 2,
        explanation:
          "The passage states: 'GPT use only the decoder portion with causal (left-to-right) masking, while BERT uses only the encoder with bidirectional attention.'",
      },
    ],
  },
  {
    id: "db-indexing",
    title: "Database Indexing Strategies",
    category: "Databases",
    difficulty: "Intermediate",
    passage:
      "Database indexes are data structures that improve the speed of data retrieval operations at the cost of additional storage space and slower writes. Without an index, the database engine must scan every row of a table to find relevant records\u2014a full table scan\u2014which becomes prohibitively expensive as tables grow to millions of rows.\n\nThe most common index type in relational databases is the B-tree (or B+ tree) index. B-trees maintain sorted data in a balanced tree structure, allowing searches, insertions, and deletions in O(log n) time. In a B+ tree specifically, all data pointers reside in leaf nodes, which are linked together, making range queries highly efficient.\n\nA composite index covers multiple columns and can satisfy queries that filter on a prefix of those columns. For example, an index on (last_name, first_name) can efficiently serve queries filtering by last_name alone, or by both last_name and first_name, but not by first_name alone. This is known as the leftmost prefix rule.\n\nHash indexes provide O(1) lookup for exact-match queries but cannot handle range queries or ordering. They are commonly used in memory-optimized tables and some NoSQL databases.\n\nCovering indexes include all columns needed by a query, allowing the database to satisfy the query entirely from the index without accessing the actual table rows. This index-only scan can dramatically reduce I/O. However, wider indexes consume more memory and slow down write operations.\n\nOver-indexing is a common antipattern. Each additional index increases storage requirements and adds overhead to INSERT, UPDATE, and DELETE operations because the index must be maintained alongside the table data. The key is to create indexes that serve your most critical and frequent query patterns.",
    questions: [
      {
        question: "What is a full table scan?",
        options: [
          "A backup operation that copies the entire table",
          "Scanning every row of a table to find relevant records",
          "An index rebuild operation",
          "A security audit of table permissions",
        ],
        answer: 1,
        explanation:
          "The passage defines it: 'the database engine must scan every row of a table to find relevant records\u2014a full table scan.'",
      },
      {
        question:
          "According to the leftmost prefix rule, which query can an index on (last_name, first_name) serve?",
        options: [
          "Filtering by first_name alone",
          "Filtering by last_name alone",
          "Filtering by email",
          "Filtering by first_name and email together",
        ],
        answer: 1,
        explanation:
          "The passage explains: 'an index on (last_name, first_name) can efficiently serve queries filtering by last_name alone, or by both last_name and first_name, but not by first_name alone.'",
      },
      {
        question: "Why is over-indexing considered an antipattern?",
        options: [
          "It makes queries slower",
          "It prevents the use of full table scans",
          "It increases storage and adds overhead to write operations",
          "It causes data corruption",
        ],
        answer: 2,
        explanation:
          "The passage warns: 'Each additional index increases storage requirements and adds overhead to INSERT, UPDATE, and DELETE operations.'",
      },
    ],
  },
];
