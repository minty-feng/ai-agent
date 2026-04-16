<div align="center">

# 🔗 全栈工程师 — 技能深度手册

**贯通前后端 · 独立交付 · 产品思维**

</div>

---

## 一、核心竞争力总览

全栈工程师的差异化价值在于**独立交付完整产品**的能力，而非前后端技能的简单叠加。

| 维度 | 描述 | 权重 |
|:---|:---|:---:|
| **端到端交付** | 从需求到上线独立完成，最小化依赖他人 | ★★★★★ |
| **全链路调试** | 浏览器 → 网络 → 服务 → 数据库的问题定位 | ★★★★★ |
| **产品思维** | 技术服务于用户价值，能做技术 vs 产品权衡 | ★★★★ |
| **架构判断** | 何时用 SSR/SSG/CSR；何时引入消息队列 | ★★★★ |
| **运维意识** | 部署、监控、回滚、成本控制 | ★★★ |

---

## 二、JavaScript / TypeScript — 全域掌握

### 浏览器 vs Node.js 环境差异

| 特性 | 浏览器 | Node.js |
|:---|:---|:---|
| 全局对象 | `window` / `globalThis` | `global` / `globalThis` |
| 模块系统 | ESM 原生 | CJS (旧) / ESM (新) |
| 文件访问 | File API / `<input>` | `fs` 模块 |
| 网络 | `fetch` / `XMLHttpRequest` | `fetch` (18+) / `http` / `https` |
| 定时器 | `setTimeout` 返回数字 | `setTimeout` 返回 Timeout 对象 |
| 流处理 | Web Streams API | Node.js Streams (Readable/Writable) |
| 线程 | Web Workers | Worker Threads / child_process |

### TypeScript 全栈配置

```json
// tsconfig.json 全栈项目推荐配置
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"],
      "@db/*": ["./packages/db/src/*"]
    }
  }
}
```

- **共享类型**：在 monorepo 的 `packages/types` 中定义前后端共用类型
- **Zod 作为单一真相来源**：Schema 同时用于运行时校验和 TypeScript 类型推断
  ```typescript
  const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
  });
  type User = z.infer<typeof UserSchema>; // 自动推断类型
  ```

---

## 三、Next.js App Router — 全栈核心

### 渲染策略选择

```
用户请求
    │
    ├── 数据完全静态？→ SSG (generateStaticParams)
    │                    部署时预渲染；CDN 缓存
    │
    ├── 数据频繁变化？→ SSR (fetch with no-store)
    │                    每次请求服务端渲染
    │
    ├── 数据半静态？→ ISR (revalidate: 60)
    │               增量静态再生；定时重建
    │
    └── 高度交互？→ CSR (use client + SWR/TanStack Query)
                   客户端 fetch；骨架屏加载
```

### Server Components 最佳实践

```typescript
// app/dashboard/page.tsx — Server Component (默认)
// 直接访问数据库，零 API 层，零 bundle 体积
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const stats = await db.query.orders.findMany({
    where: eq(orders.userId, await getCurrentUserId()),
  });
  
  return <StatsGrid data={stats} />;  // 传递序列化数据到 Client Component
}
```

```typescript
// components/StatsGrid.tsx — 必要时才 use client
'use client';

import { useState } from 'react';

export function StatsGrid({ data }: { data: OrderStats[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  // 交互逻辑在这里
}
```

### Server Actions — 表单与数据变更

```typescript
// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten() };
  
  await db.update(users).set(parsed.data).where(eq(users.id, await getUserId()));
  revalidatePath('/profile');  // 使缓存失效
}
```

### Middleware 认证守卫

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 向下游传递用户信息（避免重复鉴权）
  const response = NextResponse.next();
  response.headers.set('x-user-id', decodeToken(token).userId);
  return response;
}
```

---

## 四、数据层 — Prisma vs Drizzle 选型

### Prisma — 类型安全 ORM

```typescript
// schema.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  @@index([authorId, createdAt])
}

// 查询示例
const posts = await prisma.post.findMany({
  where: { published: true, author: { role: 'ADMIN' } },
  include: { author: { select: { name: true, avatar: true } } },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: (page - 1) * 10,
});
```

### Drizzle — SQL-First 轻量 ORM

```typescript
// 更接近 SQL 的写法，适合需要精细控制的场景
const result = await db
  .select({ id: posts.id, title: posts.title, authorName: users.name })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(and(eq(posts.published, true), gt(posts.createdAt, weekAgo)))
  .orderBy(desc(posts.createdAt))
  .limit(10);
```

### 数据库迁移最佳实践

```bash
# 开发流程
npx prisma migrate dev --name add_user_role   # 生成迁移文件 + 应用
npx prisma studio                              # 可视化数据浏览器

# 生产部署（CI/CD 中）
npx prisma migrate deploy                      # 仅应用待执行迁移

# 不停机迁移策略（大表）
# 1. 添加新列（可为 NULL）
# 2. 双写新旧列（代码兼容）
# 3. 后台 job 回填历史数据
# 4. 切换读取到新列
# 5. 删除旧列
```

---

## 五、认证系统实现

### NextAuth.js v5 配置

```typescript
// auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub,
    Credentials({
      async authorize(credentials) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });
        if (!user || !await verify(credentials.password, user.passwordHash)) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
});
```

### 密码安全

```typescript
import { hash, verify } from '@node-rs/argon2';  // 比 bcrypt 更安全、更快

// 注册时
const passwordHash = await hash(password, {
  memoryCost: 19456,    // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
});

// 登录时
const valid = await verify(passwordHash, password);
```

### CSRF 防护

- **Server Actions 内置防护**：Next.js 自动验证 Origin Header
- **自定义 API Route**：使用 `csrf` 库 + Double Submit Cookie 模式
- **SameSite Cookie**：`SameSite=Strict` 防跨站提交

---

## 六、API 设计 — tRPC vs REST

### tRPC — 端到端类型安全

```typescript
// server/routers/post.ts
export const postRouter = router({
  list: publicProcedure
    .input(z.object({ cursor: z.string().optional(), limit: z.number().min(1).max(100) }))
    .query(async ({ input, ctx }) => {
      const posts = await ctx.db.query.posts.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });
      return { posts: posts.slice(0, input.limit), nextCursor: posts[input.limit]?.id };
    }),
    
  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.insert(posts).values({ ...input, authorId: ctx.user.id });
    }),
});

// client — 完整类型推断，无需手写接口
const { data } = trpc.post.list.useQuery({ limit: 10 });
//     ↑ 自动推断为 { posts: Post[], nextCursor: string | undefined }
```

### REST API 最佳实践

```
GET    /api/v1/posts              # 列表（支持分页 ?cursor=&limit=）
POST   /api/v1/posts              # 创建
GET    /api/v1/posts/:id          # 单条
PATCH  /api/v1/posts/:id          # 部分更新（PATCH vs PUT）
DELETE /api/v1/posts/:id          # 删除

# 错误响应规范
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": [{ "field": "title", "message": "Required" }]
  }
}
```

---

## 七、实时功能

### Socket.io 多实例广播

```typescript
// 单实例
io.to(roomId).emit('message', data);

// 多实例（Redis Adapter）
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
// 现在所有实例都可以广播到同一房间
```

### Server-Sent Events（适合单向推送）

```typescript
// Next.js Route Handler
export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const interval = setInterval(() => {
        const data = encoder.encode(`data: ${JSON.stringify(getUpdate())}\n\n`);
        controller.enqueue(data);
      }, 1000);
      req.signal.addEventListener('abort', () => clearInterval(interval));
    },
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

---

## 八、部署与 DevOps

### Vercel 零配置部署

```yaml
# vercel.json 生产优化
{
  "functions": {
    "app/api/**/*.ts": { "maxDuration": 30 }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000" }
      ]
    }
  ]
}
```

### Docker 多阶段构建

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage（最小镜像）
FROM node:22-alpine AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### GitHub Actions CI/CD

```yaml
name: CI/CD
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: test, POSTGRES_PASSWORD: test }
        options: --health-cmd pg_isready
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:e2e
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: amondnet/vercel-action@v25
        with: { vercel-token: ${{ secrets.VERCEL_TOKEN }} }
```

---

## 九、安全加固清单

```
✅ 输入验证：所有 API 输入用 Zod 校验
✅ SQL 注入：使用 ORM 参数化查询，禁止字符串拼接
✅ XSS：React 默认转义；dangerouslySetInnerHTML 用 DOMPurify
✅ CSRF：Server Actions 内置保护；API Routes 检查 Origin
✅ 认证：短期 Access Token + 长期 Refresh Token + Rotation
✅ 授权：资源级权限校验（不只是角色检查）
✅ 敏感数据：密码 argon2 哈希；信用卡号加密存储
✅ 依赖安全：每周 dependabot PR；npm audit 无高危漏洞
✅ 安全响应头：CSP、HSTS、X-Frame-Options（Vercel/Nginx 配置）
✅ 限流：API 路由 rate-limit；登录接口严格限制
✅ 日志：记录关键操作审计日志；不记录敏感数据
✅ 环境变量：生产密钥不进代码库；使用 Vault/KMS
```

---

## 十、职业成长路径

### 全栈工程师核心竞争力

- **独立产品能力**：能从 0 到 1 独立完成 SaaS MVP，包括认证、支付、邮件通知
- **技术选型判断**：能在 5 分钟内判断某功能应该 SSR/SSG/CSR，某状态应该服务端/客户端管理
- **成本敏感**：了解 Vercel/Railway/AWS 的计费模型；优化冷启动；避免不必要的 serverless 调用
- **调试能力**：能用 Chrome DevTools Network + Sources + Performance 定位生产 Bug

### 必须能回答的深度问题

1. Next.js Server Components 和 Client Components 在水合 (Hydration) 上有何区别
2. `tRPC` 如何在不生成代码的情况下实现端到端类型安全
3. 如何实现一个支持乐观更新 (Optimistic Update) 的点赞功能
4. Prisma 的 `N+1` 问题如何产生，如何用 `include` 或 `DataLoader` 解决
5. 设计一个支持 1 万并发用户的实时协作文档系统

---

<div align="center">

*持续更新 · 与技术演进同步*

</div>
