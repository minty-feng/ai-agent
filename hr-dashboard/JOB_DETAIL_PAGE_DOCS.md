# Job Detail Page (`/jobs/[id]`) Documentation

## Overview

The Job Detail page is the **preparation center for each job** in ApplyFlow. It's the MVP-critical page where users prepare for interviews, track applications, and organize job-specific information.

**Route:** `/jobs/[id]` (Dynamic route using job ID)
**Type:** Client Component (`'use client'`)
**Status:** Production-ready with mock data for demonstration

---

## Page Structure

### 1. Header Section

#### Company + Role Display
- Shows company name (smaller, secondary text)
- Shows role title (large, bold heading)
- Located top-left of the page

#### Status Badge with Dropdown
- Displays current job status with visual badge
- Dropdown menu with all 5 status options:
  - Saved
  - Applied
  - Interviewing
  - Offer
  - Rejected
- Selected status has checkmark indicator
- Located top-right

#### Quick Actions Bar
Three buttons in a horizontal row:
1. **"Start mock"** (Primary button) - Initiates mock interview session
2. **"Generate tailored bullets"** (Secondary button) - Triggers Tailor Resume module
3. **"Copy link"** (Text button with icon) - Shares job page with copy confirmation

#### Limit Banner
Shows free plan usage:
- `"Free: 1/1 sessions used for this job → Upgrade"`
- Only displays when at or near limit
- Links to `/pricing` page

---

## Three Core Modules

### Module A: Job Description (Collapsible, Default Expanded)

**Purpose:** Store and edit the job posting details

**Features:**
- **Collapsible header** with expand/collapse toggle
- **Editable JD textarea** (large, 8 rows by default)
  - Disabled by default (read-only mode)
  - Enabled when "Edit" button clicked
- **Optional Notes field** (3 rows)
  - For recruiter contact info, interview dates, follow-up notes, etc.
  - Also disabled by default
- **Edit/Save buttons**
  - "Edit" button to enable editing mode
  - "Save changes" + "Cancel" buttons when in edit mode

**Mock Data:**
```typescript
jobDescription: "We're looking for a Senior Frontend Engineer..."
notes: "Met with recruiter on Jan 15. Follow up scheduled for next week."
```

**State Management:**
- `isEditingJD` - toggles edit mode
- `jdText` - stores edited job description
- `notesText` - stores notes
- Changes persist in local state (backend integration required)

---

### Module B: Tailor Resume (MVP Focus)

**Purpose:** Generate AI-powered resume customizations specific to the job role

**States:**

#### 1. Initial State (Default)
```
Heading: "Tailor Resume"
Text: "Generate tailored bullets and keyword gaps for this role."
Button: "Generate tailored bullets" (Primary)
```

#### 2. Loading State
- Shows `SkeletonLoader` component
- Simulates 2-second API delay
- Displays: "Analyzing JD and your resume…"

#### 3. Generated State (Two-Column Layout)

**Left Column: Keyword Gaps**
- Heading: "Keyword gaps" with count
- Displays as yellow pill-shaped chips
- Each chip has:
  - Keyword text
  - Copy icon button
  - Hover effect
  - Visual feedback when copied (icon changes to checkmark)

Example keywords:
```
- GraphQL
- Testing Framework
- Docker/Kubernetes
- Microservices
```

**Right Column: Tailored Bullet Suggestions**
- Heading: "Tailored bullet suggestions" with count
- Displays 3-5 cards in scrollable container
- Each card contains:
  - Category badge (color-coded: Performance, Architecture, Framework, Leadership)
  - Bullet text (achievement-focused)
  - Copy button with feedback
  - Hover shadow effect

Example bullets:
```
"Led redesign of main dashboard using React + TypeScript, 
reducing bundle size by 40% and improving Core Web Vitals scores"
```

**Bottom CTA:**
- Button: "Start a mock interview for this job" (Primary)
- Prompts user to practice with the tailored bullets

**State Management:**
- `state` - 'initial' | 'loading' | 'generated'
- `keywords` - array of KeywordGap objects
- `bullets` - array of TailoredBullet objects
- Copy feedback with 2-second timeout

---

### Module C: Mock Interview

**Purpose:** Track and initiate mock interview sessions

**Features:**

#### Initial CTA
```
Text: "10 questions in Pro, 3 in Free. Get a shareable report after."
Button: "Start mock session" (Primary)
```

#### Session History (if sessions exist)
- Table/list format showing:
  - **Date:** e.g., "January 10, 2025"
  - **Performance:** e.g., "Score: 78%"
  - **Questions:** e.g., "10 questions"
  - **Action:** "View report" button (Text variant)

#### Empty State
- Message: "Complete your first mock to get a report"
- Shown when no sessions exist

**Mock Data:**
```typescript
mockSessions: [
  { id: '1', date: 'January 10, 2025', score: 78, questionsAsked: 10 },
  { id: '2', date: 'January 5, 2025', score: 72, questionsAsked: 10 },
]
```

---

## Component Hierarchy

```
JobDetailPage (main page component)
├── Nav (header navigation)
├── LimitBanner (free plan usage)
├── Header Section
│   ├── Company + Role
│   ├── Status Badge + Dropdown
│   └── Quick Actions (buttons)
├── CollapsibleSection (Module A)
│   ├── Job Description textarea
│   ├── Notes textarea
│   └── Edit/Save buttons
├── TailorResumeModule (Module B)
│   ├── Initial state / CTA
│   ├── OR Loading state (SkeletonLoader)
│   ├── OR Generated state
│   │   ├── Left column: KeywordChip components
│   │   ├── Right column: BulletCard components
│   │   └── Bottom CTA button
│   └── CollapsibleSection wrapper
├── MockInterviewModule (Module C)
│   ├── CTA section
│   ├── Session history (if exists)
│   └── Empty state (if no sessions)
│   └── CollapsibleSection wrapper
└── Container layout
```

---

## Reusable Components Built for This Page

### 1. CollapsibleSection
**Props:**
- `title: string` - Section heading
- `defaultOpen?: boolean` - Initially expanded (default: true)
- `children: ReactNode` - Section content

**Features:**
- Click to expand/collapse
- Animated chevron icon rotation
- Smooth transitions

### 2. KeywordChip
**Props:**
- `keyword: string` - Keyword text to display
- `onCopy: (keyword: string) => void` - Copy callback

**Features:**
- Yellow pill styling
- Copy button with icon toggle (clipboard → checkmark)
- 2-second feedback duration

### 3. BulletCard
**Props:**
- `bullet: string` - Achievement text
- `category: string` - Category name
- `onCopy: (bullet: string) => void` - Copy callback

**Features:**
- Color-coded category badges
- Copy button with feedback
- Hover shadow effect
- Truncates with overflow scrolling

---

## TypeScript Types

```typescript
type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

interface JobDetail {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  jobDescription: string;
  notes: string;
}

interface KeywordGap {
  id: string;
  keyword: string;
}

interface TailoredBullet {
  id: string;
  bullet: string;
  category: string;
}

interface MockSession {
  id: string;
  date: string;
  score: number;
  questionsAsked: number;
}

type TailorState = 'initial' | 'loading' | 'generated';
```

---

## State Management

### Top-Level Page State
```typescript
const [job, setJob] = useState<JobDetail>(mockJobData);
const [isEditingJD, setIsEditingJD] = useState(false);
const [jdText, setJdText] = useState(job.jobDescription);
const [notesText, setNotesText] = useState(job.notes);
const [status, setStatus] = useState<JobStatus>(job.status);
const [isStatusOpen, setIsStatusOpen] = useState(false);
const [copied, setCopied] = useState(false);
```

### Module B (Tailor Resume) Internal State
```typescript
const [state, setState] = useState<TailorState>('initial');
const [keywords, setKeywords] = useState<KeywordGap[]>([]);
const [bullets, setBullets] = useState<TailoredBullet[]>([]);
```

---

## Event Handlers

### `handleSaveJD()`
- Validates JD and notes (future: add backend sync)
- Updates job state with edited text
- Exits edit mode

### `handleStatusChange(newStatus)`
- Updates job status
- Closes dropdown
- Persists in local state (backend integration needed)

### `handleCopyLink()`
- Copies current page URL to clipboard
- Shows visual feedback (button text changes to "Copied")
- Resets after 2 seconds

### `handleGenerateTailor()`
- Sets state to 'loading'
- Simulates 2-second API call
- Populates keywords and bullets
- Sets state to 'generated'

### `handleCopyKeyword()` / `handleCopyBullet()`
- Copies text to clipboard
- Shows checkmark feedback
- Resets after 2 seconds

---

## Styling & Design System

### Tailwind Classes Used
- `container-responsive` - responsive container with max-width
- `card` - white box with border and padding
- `btn-primary`, `btn-secondary`, `btn-text` - button variants
- `badge`, `badge-saved`, `badge-applied`, etc. - status badges
- `textarea` - styled form inputs with focus states
- `skeleton` - animated loading placeholder

### Color Variables
- **Primary:** `primary-600`, `primary-700`
- **Secondary:** `secondary-900`, `secondary-800`, `secondary-700`, `secondary-600`, `secondary-50`
- **Status Colors:**
  - Applied: Primary blue
  - Interviewing: Yellow
  - Offer: Green
  - Rejected: Red
  - Saved: Gray

### Spacing
- Vertical rhythm: `space-y-6`, `space-y-4`, `space-y-2`
- Horizontal spacing: `gap-3`, `gap-6`
- Card padding: `p-6`
- Button padding: `px-6 py-3`

---

## Mock Data

The page includes realistic mock data for all three modules:

### Job Data
- Company: "Acme Corporation"
- Role: "Senior Frontend Engineer"
- Detailed JD with requirements and responsibilities
- Notes about recruiter meeting

### Keyword Gaps
- GraphQL, Testing Framework, Docker/Kubernetes, Microservices

### Tailored Bullets
- 4 achievement-based bullets across Performance, Architecture, Framework, Leadership categories

### Session History
- 2 completed mock sessions with scores (78%, 72%) and dates

---

## Future Enhancements

### Required for Production
1. **API Integration**
   - `GET /api/jobs/[id]` - fetch job details
   - `PATCH /api/jobs/[id]` - update job/notes/status
   - `POST /api/jobs/[id]/tailor` - generate keywords and bullets
   - `POST /api/jobs/[id]/sessions` - start mock session
   - `GET /api/jobs/[id]/sessions` - fetch session history

2. **Authentication & Authorization**
   - Verify user owns the job
   - Rate limiting on tailor generation

3. **Error Handling**
   - Error states for failed API calls
   - Retry mechanisms
   - User-friendly error messages

4. **Toast Notifications**
   - Success message when JD saved
   - Error message on API failures
   - Copy feedback (can replace console.log calls)

5. **Session Integration**
   - Link "Start mock session" button to actual interview flow
   - Populate session history from API
   - Display actual mock interview questions

6. **Real Resume Data**
   - Connect to user's resume
   - Dynamic bullet generation based on actual resume
   - Keyword extraction from resume

### Nice-to-Have Features
- Undo/redo for JD edits
- Version history of JD changes
- Export JD as PDF
- Share mock interview reports
- AI feedback on tailored bullets
- Keyboard shortcuts (Cmd+S to save)

---

## Accessibility Features

- Semantic HTML elements (`<button>`, `<textarea>`, etc.)
- ARIA labels on icon buttons (`title` attributes)
- Keyboard navigation support (Tab through buttons/form fields)
- Color-coded categories with text labels (not color-only)
- Focus states on all interactive elements

---

## Performance Considerations

- Mock data generates instant (2-second simulated delay for UX)
- Lazy rendering of modules with conditional display
- Scrollable containers for long lists (keyword gaps, bullet suggestions)
- No external API calls in mock version
- Minimal re-renders due to local state isolation in child components

---

## Testing Recommendations

### Unit Tests
- Copy button feedback timeout
- Status dropdown toggle
- Edit mode enable/disable
- JD save cancellation

### Integration Tests
- Tailor resume flow (initial → loading → generated)
- Status update persistence (within session)
- Copy functionality for keywords and bullets

### E2E Tests
- Full user flow: edit JD → generate tailored bullets → view mock sessions
- Navigation from jobs list to detail page
- Link to pricing page from limit banner

---

## File Location

```
src/
└── app/
    └── jobs/
        └── [id]/
            └── page.tsx  ← You are here
```

---

## Quick Start

### View the Page
1. Navigate to `/jobs/1` (hardcoded for demo)
2. All modules are expandable/collapsible
3. Click "Generate tailored bullets" to see loading state → generated state transition

### Modify Mock Data
Edit the constants at the top of the file:
- `mockJobData` - job details
- `mockKeywordGaps` - keywords to display
- `mockTailoredBullets` - achievement bullets
- `mockSessions` - interview session history

### Add Real Data
Replace `const job = mockJobData` with API call:
```typescript
const [job, setJob] = useState<JobDetail | null>(null);

useEffect(() => {
  const fetchJob = async () => {
    const res = await fetch(`/api/jobs/${params.id}`);
    const data = await res.json();
    setJob(data);
  };
  fetchJob();
}, [params.id]);
```

---

## Related Pages
- `/jobs` - Jobs list page
- `/onboarding/first-job` - Create first job
- `/pricing` - Pricing page (linked from limit banner)

---

Generated: January 19, 2025
Last Updated: Production-ready with mock data
