export interface Term {
  term: string;
  definition: string;
  example: string;
  chinese: string;
}

export interface VocabCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  terms: Term[];
}

export const vocabularyData: VocabCategory[] = [
  {
    id: "algorithms",
    title: "Algorithms & Data Structures",
    icon: "🧮",
    description: "Core algorithm terminology used in technical interviews and code reviews",
    terms: [
      {
        term: "time complexity",
        definition: "A measure of the amount of time an algorithm takes as a function of input size.",
        example: "The time complexity of binary search is O(log n).",
        chinese: "时间复杂度",
      },
      {
        term: "space complexity",
        definition: "The amount of memory an algorithm uses relative to its input size.",
        example: "This solution has O(n) space complexity due to the auxiliary array.",
        chinese: "空间复杂度",
      },
      {
        term: "hash collision",
        definition: "When two different keys map to the same index in a hash table.",
        example: "We handle hash collisions using separate chaining with linked lists.",
        chinese: "哈希冲突",
      },
      {
        term: "amortized analysis",
        definition: "A method of analyzing the average performance of each operation over a worst-case sequence.",
        example: "Dynamic array insertion is O(1) amortized despite occasional O(n) resizing.",
        chinese: "均摊分析",
      },
      {
        term: "topological sort",
        definition: "A linear ordering of vertices in a DAG such that for every directed edge u to v, u comes before v.",
        example: "We use topological sort to determine the build order of dependent modules.",
        chinese: "拓扑排序",
      },
      {
        term: "greedy algorithm",
        definition: "An approach that makes the locally optimal choice at each step hoping to find a global optimum.",
        example: "Huffman coding uses a greedy algorithm to build an optimal prefix-free code.",
        chinese: "贪心算法",
      },
      {
        term: "memoization",
        definition: "An optimization technique that stores the results of expensive function calls for reuse.",
        example: "Adding memoization to the recursive Fibonacci reduces time complexity from O(2^n) to O(n).",
        chinese: "记忆化",
      },
      {
        term: "backtracking",
        definition: "A systematic way to try out different sequences of decisions until a solution is found.",
        example: "The N-Queens problem is typically solved using backtracking.",
        chinese: "回溯",
      },
    ],
  },
  {
    id: "os",
    title: "Operating Systems",
    icon: "🖥️",
    description: "Key OS concepts found in system programming and infrastructure discussions",
    terms: [
      {
        term: "context switch",
        definition: "The process of storing and restoring the state of a CPU so that multiple processes can share a single CPU.",
        example: "Excessive context switching can degrade system throughput.",
        chinese: "上下文切换",
      },
      {
        term: "deadlock",
        definition: "A situation where two or more processes are unable to proceed because each is waiting for the other to release a resource.",
        example: "We introduced a lock ordering policy to prevent deadlocks between the mutex pairs.",
        chinese: "死锁",
      },
      {
        term: "page fault",
        definition: "An interrupt that occurs when a program accesses a memory page not currently in physical RAM.",
        example: "High page fault rates indicate insufficient physical memory or poor locality.",
        chinese: "缺页中断",
      },
      {
        term: "virtual memory",
        definition: "A memory management technique that provides an idealized abstraction of the storage resources.",
        example: "Virtual memory allows processes to use more memory than physically available via paging.",
        chinese: "虚拟内存",
      },
      {
        term: "race condition",
        definition: "A flaw where the system behavior depends on the sequence or timing of uncontrollable events.",
        example: "The bug was caused by a race condition between the writer thread and the reader thread.",
        chinese: "竞态条件",
      },
      {
        term: "semaphore",
        definition: "A synchronization primitive used to control access to a shared resource by multiple threads.",
        example: "We used a counting semaphore to limit concurrent database connections to 10.",
        chinese: "信号量",
      },
      {
        term: "system call",
        definition: "A programmatic way for a program to request a service from the kernel of the operating system.",
        example: "The read() system call copies data from a file descriptor into user-space buffer.",
        chinese: "系统调用",
      },
      {
        term: "interrupt handler",
        definition: "A callback function in an OS that responds to hardware or software interrupts.",
        example: "The keyboard interrupt handler processes key press events and adds them to the input buffer.",
        chinese: "中断处理程序",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & Machine Learning",
    icon: "🤖",
    description: "Essential AI/ML vocabulary for reading papers and understanding model architectures",
    terms: [
      {
        term: "gradient descent",
        definition: "An optimization algorithm that iteratively adjusts parameters in the direction of steepest decrease of a loss function.",
        example: "We used stochastic gradient descent with a learning rate of 0.001 to train the model.",
        chinese: "梯度下降",
      },
      {
        term: "overfitting",
        definition: "When a model learns the training data too well, including noise, and performs poorly on unseen data.",
        example: "Adding dropout layers reduced overfitting and improved validation accuracy by 5%.",
        chinese: "过拟合",
      },
      {
        term: "embedding",
        definition: "A learned dense vector representation of discrete variables in a continuous vector space.",
        example: "Word embeddings capture semantic relationships between words in a vector space.",
        chinese: "嵌入/向量表示",
      },
      {
        term: "attention mechanism",
        definition: "A technique that allows a model to focus on relevant parts of the input when producing output.",
        example: "The transformer architecture relies entirely on self-attention mechanisms instead of recurrence.",
        chinese: "注意力机制",
      },
      {
        term: "fine-tuning",
        definition: "The process of taking a pre-trained model and training it further on a specific downstream task.",
        example: "We fine-tuned a pre-trained BERT model on our domain-specific classification dataset.",
        chinese: "微调",
      },
      {
        term: "inference",
        definition: "The process of using a trained model to make predictions on new data.",
        example: "Batch inference on the GPU reduced latency to under 10ms per request.",
        chinese: "推理",
      },
      {
        term: "tokenization",
        definition: "The process of breaking text into smaller units (tokens) for model processing.",
        example: "BPE tokenization splits rare words into subword units to handle out-of-vocabulary terms.",
        chinese: "分词/标记化",
      },
      {
        term: "loss function",
        definition: "A function that measures how far the predictions of a model are from the actual values.",
        example: "We switched from MSE to cross-entropy loss for the classification task.",
        chinese: "损失函数",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking & Distributed Systems",
    icon: "🌐",
    description: "Network and distributed systems terminology for system design and infrastructure",
    terms: [
      {
        term: "latency",
        definition: "The time delay between a request being sent and the response being received.",
        example: "P99 latency for the API endpoint should remain below 200ms.",
        chinese: "延迟",
      },
      {
        term: "throughput",
        definition: "The rate at which data or requests are successfully processed over a given time period.",
        example: "After optimization, the service handles 10,000 requests per second throughput.",
        chinese: "吞吐量",
      },
      {
        term: "load balancer",
        definition: "A device or software that distributes network traffic across multiple servers.",
        example: "The L7 load balancer routes traffic based on HTTP headers and URL paths.",
        chinese: "负载均衡器",
      },
      {
        term: "consensus algorithm",
        definition: "A protocol that ensures all nodes in a distributed system agree on a single data value.",
        example: "Raft is a consensus algorithm designed to be more understandable than Paxos.",
        chinese: "共识算法",
      },
      {
        term: "idempotent",
        definition: "An operation that produces the same result regardless of how many times it is executed.",
        example: "PUT requests should be idempotent: sending the same update twice yields the same state.",
        chinese: "幂等的",
      },
      {
        term: "circuit breaker",
        definition: "A design pattern that prevents cascading failures by stopping requests to a failing service.",
        example: "The circuit breaker trips after 5 consecutive failures and retries after a 30-second cooldown.",
        chinese: "熔断器",
      },
      {
        term: "eventual consistency",
        definition: "A consistency model where replicas will converge to the same state given enough time without new updates.",
        example: "DynamoDB provides eventual consistency by default, with optional strongly consistent reads.",
        chinese: "最终一致性",
      },
      {
        term: "service mesh",
        definition: "A dedicated infrastructure layer for handling service-to-service communication in microservices.",
        example: "We deployed Istio as our service mesh to manage mTLS and traffic routing.",
        chinese: "服务网格",
      },
    ],
  },
  {
    id: "databases",
    title: "Databases & Storage",
    icon: "💾",
    description: "Database concepts essential for backend development and system design",
    terms: [
      {
        term: "ACID properties",
        definition: "A set of properties (Atomicity, Consistency, Isolation, Durability) that guarantee reliable database transactions.",
        example: "PostgreSQL ensures ACID properties for all transactions, even under concurrent access.",
        chinese: "ACID 特性",
      },
      {
        term: "sharding",
        definition: "Splitting a database into smaller, faster, more easily managed parts called shards.",
        example: "We shard the user table by user_id to distribute load across 8 database nodes.",
        chinese: "分片",
      },
      {
        term: "index",
        definition: "A data structure that improves the speed of data retrieval operations on a database table.",
        example: "Adding a composite index on (user_id, created_at) reduced query time from 2s to 5ms.",
        chinese: "索引",
      },
      {
        term: "write-ahead log",
        definition: "A technique where changes are recorded in a log before being applied, ensuring durability.",
        example: "The write-ahead log ensures crash recovery by replaying uncommitted transactions.",
        chinese: "预写式日志",
      },
      {
        term: "query optimizer",
        definition: "A database component that determines the most efficient execution plan for a SQL query.",
        example: "The query optimizer chose a hash join over a nested loop join for the large table scan.",
        chinese: "查询优化器",
      },
      {
        term: "replication",
        definition: "The process of copying data from one database server to another to ensure redundancy.",
        example: "Asynchronous replication to the read replica introduces up to 100ms of lag.",
        chinese: "复制",
      },
      {
        term: "B-tree",
        definition: "A self-balancing tree data structure used by most relational databases for indexing.",
        example: "InnoDB uses B+ trees for both primary key and secondary index storage.",
        chinese: "B 树",
      },
      {
        term: "connection pooling",
        definition: "A technique of reusing database connections to reduce the overhead of establishing new connections.",
        example: "PgBouncer provides connection pooling, keeping a pool of 20 persistent connections.",
        chinese: "连接池",
      },
    ],
  },
];
