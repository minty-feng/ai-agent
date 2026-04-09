# ⚡ AI Timeline

An interactive, visually rich history of Artificial Intelligence — from Alan Turing's 1950 Imitation Game through GPT-4, ChatGPT, Claude, Gemini, Sora, DeepSeek R1, and the agentic AI era of 2025.

> Built with **Next.js 14 · React 18 · TypeScript · Tailwind CSS**

---

## Features

- **100+ milestone events** spanning 75 years of AI history (1950–2025)
- **Interactive search** — find events by keyword (model name, organization, concept, tag)
- **10 research categories**: Foundation, Language Model, Image Generation, Multimodal, AI Agent, Open Source, Research, Infrastructure, Robotics, Code AI
- **Impact levels**: Revolutionary, High, Medium, Low
- **Filter by year range** — narrow the timeline to any period
- **Expandable event cards** — collapse or expand detail bullets per event
- **Premium glassmorphism dark UI** — responsive across mobile and desktop

---

## Core Concepts Covered

| Concept | What It Is | Example Events |
|---|---|---|
| **LLM** | Large Language Models — foundation of modern AI | GPT-3, GPT-4, Claude, Gemini, Llama |
| **RAG** | Retrieval-Augmented Generation — reduce hallucination by retrieving facts from a knowledge base before generating answers | RAG (2020), NotebookLM, enterprise chatbots |
| **MCP** | Model Context Protocol — Anthropic's open standard for connecting AI to external tools, files, databases, and APIs | MCP (2024) |
| **Skill / Function Calling** | Structured tool invocation — LLMs call external functions/APIs (skills) on demand to take real-world actions | OpenAI Function Calling (2023), ReAct pattern |
| **AI Agent** | Autonomous systems that plan, act, use tools, and complete multi-step goals without human prompting | AutoGPT, Devin, Operator, Claude Computer Use |
| **Open Source AI** | Fully open model weights and training code | Llama, Mistral, DeepSeek R1, OpenBMB |
| **OpenBMB / OpenClaw** | Tsinghua/ModelBest open-source Chinese AI initiative — MiniCPM, ChatDev, AgentVerse, ToolBench, and the OpenClaw tool-evaluation benchmark | OpenBMB (2023) |
| **Multimodal** | Models that process text, image, audio, and video together | GPT-4o, Gemini, Sora, Flamingo |
| **Reasoning Models** | Models with extended chain-of-thought before answering | OpenAI o1, o3, Claude 3.7 Sonnet, DeepSeek R1 |
| **RLHF** | Reinforcement Learning from Human Feedback — alignment technique behind ChatGPT | InstructGPT (2022), ChatGPT |

---

## Getting Started

```bash
# Install dependencies
cd ai-timeline
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
ai-timeline/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with metadata
│   │   ├── page.tsx          # Main page — filter state and filtered events
│   │   └── globals.css       # Global styles, glassmorphism utilities
│   ├── components/
│   │   ├── Header.tsx        # Hero header with gradient and star decoration
│   │   ├── StatsSection.tsx  # Summary stats (years, events, categories)
│   │   ├── FilterBar.tsx     # Search input, category chips, impact filters
│   │   ├── Timeline.tsx      # Alternating left/right timeline layout
│   │   ├── TimelineEvent.tsx # Individual event card with expand/collapse
│   │   └── Footer.tsx        # Footer with categories and resource links
│   ├── data/
│   │   └── aiHistory.ts      # All 100+ AI events — add new ones here
│   └── types/
│       └── index.ts          # TypeScript types: AIEvent, FilterState, etc.
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## Adding New Events

All events live in `src/data/aiHistory.ts`. Add a new entry to `RAW_EVENTS`:

```ts
{
  id: 'unique-kebab-case-id',
  year: 2024,
  month: 11,              // optional (1–12)
  title: 'Event Title',
  organization: 'Organization Name',
  category: 'AI Agent',  // see Category type
  impact: 'High',        // 'Revolutionary' | 'High' | 'Medium' | 'Low'
  description: 'One-paragraph description of the event.',
  details: [
    'Bullet point detail 1.',
    'Bullet point detail 2.',
  ],
  parameters: '70B',     // optional model size
  tags: ['Tag1', 'Tag2', 'Searchable Keyword'],
  highlight: true,       // optional — adds glow border + gradient title
},
```

The array is automatically sorted by year (descending) and month. Tags are included in the full-text search.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | SSR, routing, metadata |
| **React 18** | Component model, `useMemo`, `useState` |
| **TypeScript** | Type safety across all components and data |
| **Tailwind CSS** | Utility-first styling, responsive design |
| **Inter + JetBrains Mono** | Typography (Google Fonts) |

---

## License

Data curated for educational purposes. Built as part of the [ai-agent](../README.md) project collection.
