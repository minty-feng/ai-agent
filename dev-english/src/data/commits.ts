export interface CommitExercise {
  id: string;
  scenario: string;
  diff: string;
  category: string;
  goodCommit: string;
  badCommit: string;
  explanation: string;
  tips: string[];
}

export const commitData: CommitExercise[] = [
  {
    id: "fix-null-pointer",
    scenario:
      "You fixed a bug where the user profile page crashed when the avatar URL was null.",
    diff: [
      "--- a/src/components/UserProfile.tsx",
      "+++ b/src/components/UserProfile.tsx",
      "@@ -12,7 +12,7 @@ export function UserProfile({ user }: Props) {",
      "   return (",
      "     <div className=\"profile\">",
      "-      <img src={user.avatarUrl} alt={user.name} />",
      "+      <img src={user.avatarUrl ?? '/default-avatar.png'} alt={user.name} />",
      "       <h2>{user.name}</h2>",
      "     </div>",
      "   );",
    ].join("\n"),
    category: "Bug Fix",
    goodCommit: "fix: handle null avatar URL with default fallback image",
    badCommit: "fix bug",
    explanation:
      "A good commit message follows the Conventional Commits format (type: description). It clearly states WHAT was fixed (null avatar URL) and HOW (default fallback image). The bad example lacks any meaningful information about the change.",
    tips: [
      "Use conventional commit prefixes: fix:, feat:, refactor:, docs:, test:, chore:",
      "Describe WHAT changed and WHY, not just that something changed",
      "Keep the subject line under 72 characters",
      "Use imperative mood: 'fix' not 'fixed' or 'fixes'",
    ],
  },
  {
    id: "add-rate-limiting",
    scenario:
      "You added rate limiting to the API to prevent abuse. The limiter allows 100 requests per minute per IP address.",
    diff: [
      "--- /dev/null",
      "+++ b/src/middleware/rateLimit.ts",
      "@@ -0,0 +1,9 @@",
      "+import { RateLimiter } from '../lib/rateLimiter';",
      "+",
      "+const limiter = new RateLimiter({",
      "+  windowMs: 60 * 1000,",
      "+  maxRequests: 100,",
      "+  keyGenerator: (req) => req.ip,",
      "+});",
      "+",
      "+export const rateLimitMiddleware = limiter.middleware();",
    ].join("\n"),
    category: "Feature",
    goodCommit:
      "feat: add IP-based rate limiting (100 req/min) to API endpoints",
    badCommit: "added rate limiter",
    explanation:
      "The good commit uses 'feat:' prefix to indicate a new feature, specifies the mechanism (IP-based), the limit (100 req/min), and the scope (API endpoints). The bad example uses past tense and omits critical details.",
    tips: [
      "For new features, always use the 'feat:' prefix",
      "Include key parameters or thresholds when they're important",
      "Specify the scope of the change when it's not obvious",
      "Use present tense imperative: 'add' not 'added'",
    ],
  },
  {
    id: "refactor-query",
    scenario:
      "You refactored a slow database query by replacing a subquery with a JOIN, improving response time from 2s to 50ms.",
    diff: [
      "--- a/src/repositories/orderRepository.ts",
      "+++ b/src/repositories/orderRepository.ts",
      "@@ -15,8 +15,10 @@ export class OrderRepository {",
      "   async getOrdersWithCustomers(limit: number) {",
      "-    return this.db.query(`",
      "-      SELECT *, (SELECT name FROM customers",
      "-        WHERE customers.id = orders.customer_id) as customer_name",
      "-      FROM orders ORDER BY created_at DESC LIMIT $1",
      "-    `, [limit]);",
      "+    return this.db.query(`",
      "+      SELECT o.*, c.name as customer_name",
      "+      FROM orders o",
      "+      JOIN customers c ON c.id = o.customer_id",
      "+      ORDER BY o.created_at DESC LIMIT $1",
      "+    `, [limit]);",
      "   }",
    ].join("\n"),
    category: "Performance",
    goodCommit:
      "perf: replace correlated subquery with JOIN in order listing\n\nReduces response time from ~2s to ~50ms by eliminating\nper-row subquery execution.",
    badCommit: "refactored query",
    explanation:
      "The good commit uses 'perf:' to signal a performance improvement, explains the technique (replace subquery with JOIN), and includes a body with measurable impact (2s to 50ms). The bad example is vague and uninformative.",
    tips: [
      "Use 'perf:' for performance improvements, 'refactor:' for code restructuring without behavior change",
      "Include measurable impact when available (latency, throughput, memory)",
      "Use the commit body for 'why' details\u2014the diff shows 'what'",
      "Separate subject from body with a blank line",
    ],
  },
  {
    id: "add-unit-tests",
    scenario:
      "You added unit tests for the authentication service, covering login, logout, and token refresh flows.",
    diff: [
      "--- /dev/null",
      "+++ b/src/services/__tests__/authService.test.ts",
      "@@ -0,0 +1,18 @@",
      "+describe('AuthService', () => {",
      "+  describe('login', () => {",
      "+    it('should return tokens for valid credentials', async () => {",
      "+      // ...",
      "+    });",
      "+    it('should throw UnauthorizedError for invalid password', async () => {",
      "+      // ...",
      "+    });",
      "+  });",
      "+  describe('logout', () => {",
      "+    it('should invalidate the refresh token', async () => {",
      "+      // ...",
      "+    });",
      "+  });",
      "+  describe('refreshToken', () => {",
      "+    it('should issue new access token for valid refresh token', async () => {",
      "+      // ...",
      "+    });",
      "+  });",
      "+});",
    ].join("\n"),
    category: "Testing",
    goodCommit:
      "test: add unit tests for AuthService login, logout, and token refresh",
    badCommit: "tests",
    explanation:
      "The good commit uses 'test:' prefix and lists the specific areas covered (login, logout, token refresh) and the service being tested (AuthService). The bad example gives zero useful information.",
    tips: [
      "Use 'test:' prefix for test additions or changes",
      "Mention what module/service the tests cover",
      "List the key scenarios if they fit in the subject line",
      "Don't include 'add tests for' if the test: prefix already implies it",
    ],
  },
  {
    id: "breaking-api-change",
    scenario:
      "You changed the API response format for the /users endpoint from a flat array to a paginated object with metadata.",
    diff: [
      "--- a/src/routes/users.ts",
      "+++ b/src/routes/users.ts",
      "@@ -8,4 +8,12 @@ router.get('/users', async (req, res) => {",
      "-  const users = await userService.listAll();",
      "-  res.json(users);",
      "+  const page = parseInt(req.query.page as string) || 1;",
      "+  const limit = parseInt(req.query.limit as string) || 20;",
      "+  const { users, total } = await userService.listPaginated(page, limit);",
      "+  res.json({",
      "+    data: users,",
      "+    pagination: {",
      "+      page, limit, total,",
      "+      totalPages: Math.ceil(total / limit),",
      "+    },",
      "+  });",
      " });",
    ].join("\n"),
    category: "Breaking Change",
    goodCommit:
      "feat!: paginate /users endpoint response\n\nBREAKING CHANGE: GET /users now returns { data, pagination }\ninstead of a plain array. Clients must update to read the\n'data' field for the user list.",
    badCommit: "update users endpoint",
    explanation:
      "The good commit uses 'feat!:' (the ! signals a breaking change per Conventional Commits), has a BREAKING CHANGE footer explaining what changed and what clients must do. The bad example completely hides the breaking nature of the change.",
    tips: [
      "Use '!' after the type for breaking changes: feat!:, fix!:, refactor!:",
      "Include BREAKING CHANGE: in the commit body explaining migration steps",
      "Describe both the old and new behavior so consumers understand the delta",
      "This is critical for library/API maintainers\u2014downstream teams rely on these signals",
    ],
  },
];
