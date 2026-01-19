# HackerRank Dashboard

A modern, responsive dashboard implementation inspired by HackerRank's platform, built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- **Dashboard Overview**: User statistics including problems solved, current streak, ranking, and points
- **Practice Challenges**: Grid of coding challenges with difficulty levels, points, and success rates
- **Active Competitions**: List of ongoing competitions with participant counts and prizes
- **Skills Tracking**: Visual progress bars for different programming skills and competencies
- **Achievements**: Showcase of earned badges and accomplishments
- **Responsive Design**: Mobile-friendly layout that works on all screen sizes
- **Modern UI**: Clean, professional interface with smooth transitions and hover effects

## Tech Stack

- **Framework**: Next.js 14.2.5
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.7
- **UI Library**: React 18.3.1

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or pnpm package manager

### Installation

1. Navigate to the project directory:
```bash
cd hr-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3002](http://localhost:3002) in your browser

### Available Scripts

- `npm run dev` - Start the development server on port 3002
- `npm run build` - Build the production application
- `npm start` - Start the production server on port 3002
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
hr-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout component
│   │   └── page.tsx         # Main dashboard page
│   ├── components/
│   │   ├── Header.tsx       # Navigation header
│   │   ├── StatsCard.tsx    # User statistics cards
│   │   ├── ChallengeCard.tsx # Practice challenge cards
│   │   └── SkillCard.tsx    # Skill progress cards
│   └── styles/
│       └── globals.css      # Global styles and Tailwind imports
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Components

### Header
Navigation bar with logo, menu items, search functionality, and user profile.

### StatsCard
Displays individual statistics like problems solved, streak, ranking, and points.

### ChallengeCard
Shows coding challenge information including title, difficulty, points, and success rate.

### SkillCard
Displays skill progress with level indicators and progress bars.

## Customization

The dashboard uses custom colors defined in `tailwind.config.ts`:
- `hr-green`: #39424e
- `hr-dark`: #1e2022
- `hr-light`: #f4f4f4

You can modify these colors and add more styling options in the Tailwind configuration.

## License

This is a demonstration project for educational purposes.
