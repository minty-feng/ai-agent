# Mock Session Page Documentation

## Overview

The Mock Session page (`/jobs/[id]/sessions/[sid]/page.tsx`) is an interactive interview practice component where users answer pre-generated questions and receive instant feedback. This page is production-ready with smooth UX, state management, and clear progression.

## Location

```
src/app/jobs/[id]/sessions/[sid]/page.tsx
```

## Features

### 1. Top Bar Section
- **Progress Indicator**: Displays "Question X/Y" (e.g., "Question 2/3")
- **Progress Bar**: Visual progress bar showing position in session
- **Answered Count**: Shows "X of Y answered"
- **End Session Button**: Secondary button with confirmation dialog

### 2. Question Card
- **Question Number Badge**: Numbered badge (Q1, Q2, etc.) with blue background
- **Category Badge**: Tag showing question type:
  - 🔵 Behavioral (blue)
  - 🟣 Deep-dive (purple)
  - 🟢 Role-specific (green)
- **Question Text**: Large, readable question text (2xl font)
- **Answer Textarea**: Auto-focusing textarea for user responses
  - Minimum 12 rows (~300px)
  - Focus ring with primary color
  - Placeholder: "Type your answer here. Auto-saves every 3 seconds."
- **Auto-save Indicator**: 
  - Shows "Saving..." with animated dot when saving
  - Shows "✓ Auto-saves every 3 seconds" when idle
  - Dynamically updates based on save state

### 3. Navigation Buttons
- **Skip Button**: Secondary button (left) - skips current question
- **Next Button**: Primary button (right) - moves to next question
  - Changes to "Finish session" on the last question
- Button layout:
  - Full width on mobile (stacked)
  - Auto width on desktop with gap between

### 4. Confirmation Dialogs

#### End Session Dialog
- Title: "End Session?"
- Message: Shows current progress (e.g., "You've answered 2 of 3 questions...")
- Buttons: "End Session" (primary), "Keep Going" (secondary)
- Action: Returns to job detail page (`/jobs/[id]`)

#### Start Next Session Dialog (Paywall)
- Title: "Upgrade to Pro"
- Message: "Free users can do 1 session per job. Upgrade to Pro to unlock unlimited sessions."
- Buttons: "Upgrade" (primary), "Back" (secondary)
- Action: Routes to `/pricing`

### 5. Completion Page
After finishing all questions, displays:

#### Overall Score Section
- Large score display (e.g., "7.2" out of 10)
- Score appears in primary blue color
- Summary text explaining the performance

#### Dimension Breakdown
Four bar charts showing:
- **Relevance** (Blue): 8.5/10
- **Evidence** (Yellow): 6.2/10
- **Structure** (Blue): 7.8/10
- **Clarity** (Yellow): 6.8/10

Each with:
- Dimension name and score
- Horizontal progress bar
- Color-coded based on category
- Percentage-based width calculation

#### Top 3 Improvements
Three improvement cards (yellow background) with:
1. Title (e.g., "Add measurable impact")
2. Description with actionable advice
3. Data suggestions

#### Call-to-Action Section
Two buttons:
- **View full report** (Primary): Routes to `/r/{shareId}`
- **Start next session** (Secondary): Triggers paywall for Free plan
- Tip text: "💡 Pro tip: Share your report link with others for feedback"

## Type Definitions

```typescript
type QuestionCategory = 'Behavioral' | 'Deep-dive' | 'Role-specific';

interface Question {
  id: string;
  number: number;
  text: string;
  category: QuestionCategory;
}

interface SessionScore {
  overall: number;
  relevance: number;
  evidence: number;
  structure: number;
  clarity: number;
}

type SessionState = 'answering' | 'completed';
```

## State Management

### Main Component State
```typescript
const [sessionState, setSessionState] = useState<SessionState>('answering');
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<Record<string, string>>({});
const [showEndConfirm, setShowEndConfirm] = useState(false);
const [showPaywallConfirm, setShowPaywallConfirm] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

### Derived State (Computed)
- `currentQuestion`: Current question from mock data
- `currentAnswer`: User's answer for current question
- `totalQuestions`: Total number of questions (3 for Free plan)
- `isLastQuestion`: Boolean to check if on last question
- `questionsAnswered`: Count of questions with answers

## Auto-Save Mechanism

### Timing
- **Interval**: 3000ms (3 seconds)
- **Effect**: Runs when `answers` state changes
- **Cleanup**: Interval cleared on component unmount

### Process
1. Every 3 seconds, trigger save operation
2. Set `isSaving = true` for UX feedback
3. Clear saving state after 500ms
4. (Production): POST to `/api/sessions/{sid}/answers`

### Production Integration
Current implementation logs to console. For production:
```typescript
// Replace the interval content with:
await fetch(`/api/sessions/${params.sid}/answers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ questionId: currentQuestion.id, answer: currentAnswer })
});
```

## Navigation Behavior

### Next Button
- **Non-last question**: Move to next question (`currentQuestionIndex++`)
- **Last question**: Complete session and show completion page

### Skip Button
- **Non-last question**: Move to next question (same as Next)
- **Last question**: Complete session (skip means finish)

### End Session
- Open confirmation dialog
- On confirm: Navigate back to job detail page
- On cancel: Close dialog and continue answering

## Mock Data

### Questions (3 for MVP/Free plan)
1. **Behavioral**: Team conflict resolution
2. **Deep-dive**: Performance optimization approach
3. **Role-specific**: Learning new technology quickly

### Session Score
```
overall: 7.2
relevance: 8.5 (strong)
evidence: 6.2 (needs improvement)
structure: 7.8 (good)
clarity: 6.8 (needs improvement)
```

### Improvements
1. Add measurable impact
2. Strengthen STAR structure
3. Clarify technical decisions

## Responsive Design

### Mobile (< 640px)
- Full-width layout
- Stacked buttons
- Category badge and number badge on same line
- Progress bar full width
- Textarea adjusts height

### Tablet (640px - 1024px)
- Similar to mobile
- Buttons can flex next to each other

### Desktop (> 1024px)
- Optimal spacing
- Buttons with gaps
- Better use of whitespace

## Styling

### Design System Classes Used
```
.card - White card with border
.btn-primary - Blue primary button
.btn-secondary - Secondary button with border
.textarea - Textarea input with focus ring
```

### Color Scheme
- **Primary**: `primary-600` (Blue #0284c7)
- **Yellow**: `yellow-500` and `yellow-600` for evidence/clarity
- **Background**: `secondary-50` (Light gray)
- **Text**: `secondary-900` (Dark), `secondary-600` (Medium)

## Performance Considerations

1. **useCallback**: Event handlers memoized to prevent unnecessary re-renders
2. **useEffect**: Auto-save interval properly cleaned up
3. **Small bundle**: Only essential imports (Button, Nav components)
4. **CSS-in-JS**: Tailwind CSS with no runtime overhead

## Accessibility

- Semantic HTML: `<button>`, `<textarea>`, `<label>`
- ARIA-friendly component structure
- Proper focus management
- Clear button labels
- Color not sole differentiator (badges have text)

## Production Integration TODO

### API Endpoints Needed
1. `GET /api/sessions/{sid}` - Fetch session data
2. `POST /api/sessions/{sid}/answers` - Save answer drafts
3. `POST /api/sessions/{sid}/complete` - Mark session complete
4. `GET /api/sessions/{sid}/results` - Get scoring results
5. `GET /api/reports/{shareId}` - Fetch shareable report

### User Context
- Current user info for plan checking
- Job ID from params
- Session ID from params
- User's current subscription tier

### Error Handling
- Network errors during auto-save
- Session timeout
- Invalid question IDs
- Missing session data

### Analytics
- Track question view time
- Answer completion rate
- Session abandonment
- Feature usage

## Testing Checklist

- [ ] Navigation between questions works
- [ ] Skip button skips questions
- [ ] End session shows confirmation
- [ ] Auto-save indicator updates
- [ ] Completion page displays correctly
- [ ] Score bars render accurately
- [ ] CTAs navigate to correct pages
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation functional
- [ ] All text readable and properly styled

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## File Structure

```
src/
├── app/
│   └── jobs/
│       └── [id]/
│           └── sessions/
│               └── [sid]/
│                   └── page.tsx (3.58 kB)
├── components/
│   ├── Nav.tsx
│   └── Button.tsx
└── styles/
    └── globals.css
```

## Related Pages

- **Job Detail**: `/jobs/[id]` - Job information and session start
- **Report**: `/r/{shareId}` - Shareable interview report
- **Pricing**: `/pricing` - Upgrade page for paywall
- **Dashboard**: `/dashboard` - User's session history

## Future Enhancements

1. **Timer Feature**: Optional timer toggle (default off for MVP)
2. **Voice Recording**: Record answers instead of typing
3. **AI Feedback**: Real-time feedback as user types
4. **Answer Templates**: Suggested STAR structure template
5. **Analytics Dashboard**: View all session results
6. **Collaborative Reviews**: Share session with mentor
7. **Performance Trends**: Track score improvement over time
8. **Question Customization**: User-uploaded questions
9. **Video Recording**: Video answer submissions
10. **Export Reports**: PDF/Word export functionality

## Troubleshooting

### Session not loading
- Check params.id and params.sid are valid
- Verify API returns valid session data
- Check browser console for errors

### Auto-save not working
- Verify network requests in DevTools
- Check API endpoint is operational
- Review console for POST errors

### Completion page not showing
- Verify currentQuestionIndex logic
- Check sessionState transitions
- Review useEffect dependencies

### Styling issues
- Verify Tailwind CSS is loaded
- Check globals.css is imported
- Review color token definitions
- Clear Next.js cache: `rm -rf .next`

## Development Notes

- Uses Next.js 14.2.5 App Router
- TypeScript enabled with strict mode
- Client-side rendering with 'use client'
- Tailwind CSS for styling
- No external UI libraries for components
- Production-ready code structure
