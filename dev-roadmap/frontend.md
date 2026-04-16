<div align="center">

# 🎨 前端工程师 — 技能深度手册

**核心竞争力 · 技术深度 · 职业成长路径**

</div>

---

## 一、核心竞争力总览

优秀前端工程师需要在以下五个维度建立差异化优势：

| 维度 | 描述 | 权重 |
|:---|:---|:---:|
| **工程基础** | HTML/CSS/JS 底层原理、浏览器渲染机制 | ★★★★★ |
| **框架深度** | React / Vue 原理级掌握，源码级调试能力 | ★★★★★ |
| **性能工程** | Core Web Vitals、运行时性能、构建优化 | ★★★★ |
| **工程体系** | 测试、CI/CD、代码质量、可维护性 | ★★★★ |
| **跨端与架构** | SSR/SSG、微前端、边缘计算 | ★★★ |

---

## 二、HTML & CSS — 被低估的核心技能

### 必须熟练掌握

- **CSS 布局系统**
  - `Flexbox`：主轴/交叉轴、`flex-grow`/`flex-shrink`/`flex-basis`、`align-content` vs `align-items`
  - `Grid`：`grid-template-areas` 命名区域、`auto-fill` vs `auto-fit`、`minmax()`、子网格 (subgrid)
  - 传统布局陷阱：BFC、清除浮动、`position: sticky` 堆叠上下文

- **CSS 现代特性**
  - `CSS Custom Properties`（变量）+ 动态主题切换
  - `@container` 容器查询（取代媒体查询的组件级响应式）
  - `@layer` 层叠层控制规则优先级
  - `clamp()` / `min()` / `max()` 响应式数值
  - `scroll-snap`、`overscroll-behavior`、`aspect-ratio`

- **动画与过渡**
  - `@keyframes` 帧动画 vs `transition` 过渡
  - `animation-fill-mode`、`animation-play-state`
  - CSS 动画 vs JS 动画性能对比（合成层触发条件：`transform`/`opacity`）
  - `Web Animations API`：`element.animate()` 程序化控制

- **HTML 语义化**
  - 正确使用 `<article>`、`<section>`、`<nav>`、`<main>`、`<aside>`、`<figure>`
  - `<dialog>` 原生弹窗、`<details>/<summary>` 折叠
  - SEO 语义：`<h1>` 单页唯一、Open Graph `<meta>`、`<link rel="canonical">`
  - 表单语义：`<fieldset>`、`<legend>`、`<label for>`、`required`/`pattern` 原生校验

---

## 三、JavaScript — 深度掌握指南

### 语言运行时原理

- **事件循环 (Event Loop)**
  - 宏任务队列 vs 微任务队列执行顺序
  - `requestAnimationFrame` 在渲染流水线中的位置
  - `queueMicrotask()`、`MessageChannel` 技巧
  - `setTimeout(fn, 0)` 为何不是 0ms

- **内存管理**
  - V8 堆结构：新生代 (Scavenge GC) + 老生代 (Mark-Compact)
  - 内存泄漏常见场景：闭包、全局变量、定时器、事件监听未清理、DOM 引用
  - `WeakRef` / `FinalizationRegistry` 弱引用实践
  - Chrome DevTools Memory 面板：Heap Snapshot 快照对比、Allocation Timeline

- **异步编程模式**
  - `Promise` 链式调用、`Promise.all` / `allSettled` / `race` / `any`
  - `async/await` 错误处理：`try/catch` 陷阱、并行 vs 串行 `await`
  - `AbortController` 取消 fetch 请求
  - `Generator` + `yield` 实现协程；`for await...of` 异步迭代器

- **类型系统与 ES 新特性**
  - `Proxy` / `Reflect`：实现响应式、访问控制、日志代理
  - `Symbol`：迭代协议 (`Symbol.iterator`)、`Symbol.toPrimitive`、私有字段替代
  - `Temporal API`（取代 `Date`）日期时间处理
  - `Object.hasOwn()`、`Array.at()`、`structuredClone()`

---

## 四、TypeScript — 工程级类型体操

### 类型系统核心

```typescript
// 条件类型
type IsArray<T> = T extends any[] ? true : false;

// infer 推断
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 映射类型 + 模板字面量
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (val: T[K]) => void;
};

// 递归类型
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };

// 联合分发
type Flatten<T> = T extends Array<infer Item> ? Item : T;
```

### 工程实践要点

- **`strict` 模式全家桶**：`noImplicitAny`、`strictNullChecks`、`strictFunctionTypes`
- **声明文件**：编写 `*.d.ts`；理解 `module augmentation` 扩展第三方类型
- **`satisfies` 运算符**：在保持字面量类型的同时验证形状
- **`const assertion`**：`as const` 冻结推断为字面量类型
- **项目引用**：`tsconfig references` 实现 monorepo 增量编译
- **类型测试**：`tsd` 工具编写类型级单元测试

---

## 五、React 深度掌握

### Hooks 原理与陷阱

| Hook | 核心原理 | 常见陷阱 |
|:---|:---|:---|
| `useState` | 闭包快照；异步更新批处理 | 基于旧 state 更新用函数形式 |
| `useEffect` | 依赖数组对比 (Object.is)；cleanup 时机 | 无限循环；stale closure |
| `useCallback` / `useMemo` | 记忆化引用；避免子组件不必要渲染 | 过度使用反而增加内存开销 |
| `useRef` | 跨渲染保持引用；DOM 访问 | 修改 ref 不触发重渲染 |
| `useReducer` | 复杂状态机；纯函数 reducer | 与 Context 组合替代 Redux |
| `useDeferredValue` | Concurrent 模式下延迟低优先级更新 | 适用于高代价渲染场景 |
| `useTransition` | 标记非紧急状态更新；保持 UI 响应 | `isPending` 指示过渡状态 |

### React 18 Concurrent 模式

- **自动批处理**：事件处理、`setTimeout`、`Promise` 回调中的多次 setState 自动合并
- **`startTransition`**：将路由切换、搜索过滤标记为可中断的低优先级更新
- **`Suspense` 数据获取**：配合 `use()` Hook（React 19）或 SWR/TanStack Query 的 suspense 模式
- **`React.lazy` + `Suspense`**：代码分割与优雅降级

### React Server Components (RSC)

- 服务端组件：零 bundle 体积；直接读取数据库/文件系统
- 客户端组件：`'use client'` 边界；只有叶节点需要标记
- Server Actions：`'use server'` 函数；表单提交无 API 路由
- 数据流：`<Suspense>` + 流式 HTML；边缘渲染优化

---

## 六、性能工程 — Core Web Vitals 专项

### 关键指标优化策略

| 指标 | 全称 | 好的阈值 | 优化策略 |
|:---|:---|:---:|:---|
| **LCP** | Largest Contentful Paint | < 2.5s | 预加载关键资源；优化服务器响应；字体不阻塞渲染 |
| **INP** | Interaction to Next Paint | < 200ms | 分解长任务；`scheduler.yield()`；减少主线程阻塞 |
| **CLS** | Cumulative Layout Shift | < 0.1 | 图片/视频设置 `width`/`height`；字体 `font-display: swap` |
| **FCP** | First Contentful Paint | < 1.8s | 关键 CSS 内联；消除渲染阻塞资源 |
| **TTFB** | Time To First Byte | < 800ms | 服务器缓存；CDN；Edge 渲染 |

### 运行时性能调优

- **减少重排 (Reflow)**：批量 DOM 修改用 `DocumentFragment`；读写分离避免强制同步布局
- **合成层优化**：`will-change: transform` 提升到合成层；避免滥用导致内存暴增
- **虚拟滚动**：`react-window` / `react-virtual`；10000+ 列表必用
- **图片优化**：WebP/AVIF 格式；`<img loading="lazy">`；`srcset` 响应式图片；Next.js `<Image>` 自动优化
- **字体优化**：`<link rel="preload" as="font">`；`font-display: optional`；子集化 (unicode-range)

---

## 七、构建工具深度

### Vite 5 核心机制

- **开发模式**：原生 ES Modules + `esbuild` 预构建依赖；无 Bundle 启动极快
- **生产构建**：`Rollup` 打包；Tree Shaking；代码分割策略
- **插件 API**：`transform` / `resolveId` / `load` 钩子；虚拟模块
- **依赖预构建**：CommonJS → ESM 转换；强制预构建：`optimizeDeps.include`

### 构建优化实战

```javascript
// vite.config.ts 生产优化示例
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        }
      }
    },
    chunkSizeWarningLimit: 500,
  }
}
```

- **Bundle 分析**：`rollup-plugin-visualizer` 可视化；识别重复依赖
- **Tree Shaking 失效原因**：副作用标记；CommonJS 模块；动态 `import()`

---

## 八、测试体系

### 测试金字塔

```
        /\
       /E2E\        少量：关键用户流程 (Playwright)
      /------\
     /集成测试 \      适量：组件交互 (RTL + Vitest)
    /----------\
   /  单元测试   \   大量：工具函数、hooks、纯函数 (Vitest)
  /--------------\
```

### 各层测试要点

- **Vitest 单元测试**
  - `vi.fn()` / `vi.spyOn()` Mock 函数
  - `vi.mock()` 模块级 Mock；`vi.importActual()` 部分 Mock
  - 快照测试 `toMatchSnapshot()`；内联快照 `toMatchInlineSnapshot()`

- **React Testing Library**
  - 查询优先级：`getByRole` > `getByLabelText` > `getByText` > `getByTestId`
  - `userEvent.type()` / `userEvent.click()` 模拟真实用户交互
  - `act()` 包裹异步状态更新；`waitFor()` 等待异步断言
  - 自定义 render：包裹 Provider（Router、Store、Theme）

- **MSW v2 API Mock**
  - `http.get()` / `http.post()` Handler 定义
  - 浏览器 Service Worker + Node 环境双模式
  - `server.use()` 测试内覆盖；`server.resetHandlers()` 后清理

- **Playwright E2E**
  - `page.getByRole()` 优先无障碍查询
  - 网络拦截：`page.route()` Mock API 响应
  - Visual Regression：`expect(page).toHaveScreenshot()`
  - CI 并行：`--shard=1/3` 分片执行

---

## 九、工程化与 DevOps

### 代码质量工具链

```
提交前                构建时              CI 中
─────────            ─────────           ─────────
husky                ESLint              Vitest
lint-staged          TypeScript          Playwright
commitlint           Prettier            Lighthouse CI
```

- **ESLint 规则集**：`@typescript-eslint/recommended`；`eslint-plugin-react-hooks`（依赖数组规则）；`eslint-plugin-jsx-a11y`
- **Prettier 集成**：`eslint-config-prettier` 关闭冲突规则；`prettier-plugin-tailwindcss` 类名排序
- **Commitlint**：`@commitlint/config-conventional` 规范提交信息；触发 `semantic-release` 自动发版

### GitHub Actions 前端 CI

```yaml
jobs:
  ci:
    steps:
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
      - uses: actions/upload-artifact@v4  # 保存构建产物
```

---

## 十、无障碍 (a11y) — 差异化竞争力

### WCAG 2.1 AA 核心要求

- **感知性**：文字对比度 ≥ 4.5:1；图片提供替代文本；不依赖颜色传递信息
- **可操作性**：所有功能可键盘完成；焦点可见；跳转链接 Skip Navigation
- **可理解性**：`<html lang>` 设置语言；错误提示关联到具体字段；一致导航
- **鲁棒性**：标准 HTML 语义；ARIA 增强不替代语义

### 常用 ARIA 模式

```html
<!-- 对话框 -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">确认删除</h2>
</div>

<!-- 状态通知 -->
<div aria-live="polite" aria-atomic="true">3 条新消息</div>

<!-- 按钮状态 -->
<button aria-expanded="false" aria-controls="menu">菜单</button>
```

---

## 十一、职业成长路径

### Junior → Senior 关键跨越

| 层级 | 核心能力 | 技术信号 |
|:---|:---|:---|
| **Junior** | 完成功能需求；遵循现有模式 | 能用 React 实现 CRUD；理解组件生命周期 |
| **Mid** | 独立设计组件 API；发现并修复性能问题 | 能做代码审查；了解构建流水线；会写测试 |
| **Senior** | 制定架构方案；提升整个团队的交付质量 | 主导技术选型；优化 CI/CD；讲解底层原理 |
| **Staff** | 跨团队技术影响力；定义工程标准 | 推动 Monorepo 迁移；建立设计系统；布道 a11y |

### 必须能回答的深度问题

1. 浏览器从输入 URL 到页面渲染的完整流程（网络 + 渲染管线）
2. `Virtual DOM` 的本质与 Fiber 架构解决了什么问题
3. `useEffect` 依赖数组为空 `[]` vs 不传 vs 有依赖的区别与底层机制
4. 如何定位和解决生产环境内存泄漏
5. 设计一个支持 100+ 组件的设计系统的架构方案
6. 微前端的 JS 沙箱隔离原理（`with` + `Proxy`）

---

<div align="center">

*持续更新 · 与技术演进同步*

</div>
