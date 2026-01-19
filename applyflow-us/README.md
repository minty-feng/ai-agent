# ApplyFlow MVP v1.0

Turn any job description into a tailored interview plan in minutes.

## Features

- **Job Tracker**: Track applications with status updates
- **Resume Tailoring**: Generate tailored bullets and keyword gaps for each role
- **Mock Interviews**: Practice with AI-generated questions based on your JD and resume
- **Shareable Reports**: Get detailed feedback and share with mentors/friends
- **Free Preview**: Try without signup - paste a JD and get 3 sample questions

## Getting Started

Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Routes

### Public
- `/` – Landing page
- `/try` – Free preview (no login required)
- `/signup` – Sign up
- `/login` – Log in
- `/pricing` – Pricing information
- `/r/:shareId` – Shareable report (public)

### Authenticated
- `/jobs` – Job tracker (list)
- `/jobs/:id` – Job detail (preparation center)
- `/jobs/:id/sessions/:sid` – Mock interview session
- `/onboarding/resume` – Resume import
- `/onboarding/first-job` – First job creation

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

## MVP v1.0 Scope

Desktop-first, mobile-ready. Free plan: 3 jobs, 1 session per job, 3 questions. Pro plan: unlimited jobs, 10 questions per session, detailed feedback.