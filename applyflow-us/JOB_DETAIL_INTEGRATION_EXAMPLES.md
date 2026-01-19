# Job Detail Page - Integration Examples

## Quick Reference for Developers

### Import the Page
```typescript
// The page is automatically available at /jobs/[id]
// No manual imports needed - Next.js handles dynamic routing
```

### Access the Page
```
Frontend: http://localhost:3000/jobs/1
         http://localhost:3000/jobs/abc123
         http://localhost:3000/jobs/any-id-here
```

---

## API Integration Examples

### Example 1: Fetch Job Data

**Current (Mock):**
```typescript
const [job, setJob] = useState<JobDetail>(mockJobData);
```

**Production (with API):**
```typescript
import { useEffect } from 'react';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        const data = await response.json();
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary message={error} />;
  if (!job) return <NotFoundPage />;

  return <JobDetailContent job={job} />;
}
```

---

### Example 2: Update Job Status

**Current:**
```typescript
const handleStatusChange = (newStatus: JobStatus) => {
  setStatus(newStatus);
  setJob({ ...job, status: newStatus });
  setIsStatusOpen(false);
};
```

**Production:**
```typescript
const handleStatusChange = async (newStatus: JobStatus) => {
  try {
    const response = await fetch(`/api/jobs/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    
    if (!response.ok) throw new Error('Failed to update status');
    
    const updatedJob = await response.json();
    setJob(updatedJob);
    setStatus(newStatus);
    setIsStatusOpen(false);
    
    // Show success toast
    showToast({
      message: `Status updated to ${newStatus}`,
      type: 'success',
    });
  } catch (error) {
    showToast({
      message: 'Failed to update status. Please try again.',
      type: 'error',
    });
  }
};
```

---

### Example 3: Save Job Description

**Current:**
```typescript
const handleSaveJD = () => {
  setJob({ ...job, jobDescription: jdText, notes: notesText });
  setIsEditingJD(false);
};
```

**Production:**
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSaveJD = async () => {
  setIsSaving(true);
  try {
    const response = await fetch(`/api/jobs/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: jdText,
        notes: notesText,
      }),
    });

    if (!response.ok) throw new Error('Failed to save');

    const updatedJob = await response.json();
    setJob(updatedJob);
    setIsEditingJD(false);

    showToast({
      message: 'Job description saved successfully',
      type: 'success',
    });
  } catch (error) {
    showToast({
      message: 'Failed to save changes. Please try again.',
      type: 'error',
    });
  } finally {
    setIsSaving(false);
  }
};
```

---

### Example 4: Generate Tailored Content

**Current:**
```typescript
const handleGenerateTailor = async () => {
  setState('loading');
  await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS));
  setKeywords(mockKeywordGaps);
  setBullets(mockTailoredBullets);
  setState('generated');
};
```

**Production:**
```typescript
const handleGenerateTailor = async () => {
  setState('loading');
  try {
    const response = await fetch(`/api/jobs/${params.id}/tailor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: jdText,
        // Optional: include user's resume data
        resumeId: currentUser.resumeId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate tailored content');
    }

    const { keywords, bullets } = await response.json();
    setKeywords(keywords);
    setBullets(bullets);
    setState('generated');

    // Track analytics
    trackEvent('tailor_generated', {
      jobId: params.id,
      keywordsCount: keywords.length,
      bulletsCount: bullets.length,
    });
  } catch (error) {
    setState('initial');
    showToast({
      message: 'Failed to generate tailored bullets. Please try again.',
      type: 'error',
    });
  }
};
```

---

### Example 5: Fetch Mock Sessions

**Current:**
```typescript
const mockSessions: MockSession[] = [
  { id: '1', date: 'January 10, 2025', score: 78, questionsAsked: 10 },
  { id: '2', date: 'January 5, 2025', score: 72, questionsAsked: 10 },
];

// Usage in MockInterviewModule
const hasSessions = mockSessions.length > 0;
```

**Production:**
```typescript
const [sessions, setSessions] = useState<MockSession[]>([]);
const [sessionsLoading, setSessionsLoading] = useState(false);

useEffect(() => {
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${params.id}/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  fetchSessions();
}, [params.id]);

// Usage in MockInterviewModule
const hasSessions = sessions.length > 0;

if (sessionsLoading) return <SkeletonLoader lines={3} />;
```

---

### Example 6: Start Mock Session

**Current:**
```typescript
<Button variant="primary" className="w-full sm:w-auto">
  Start mock session
</Button>
```

**Production:**
```typescript
const [isStartingSession, setIsStartingSession] = useState(false);

const handleStartMock = async () => {
  setIsStartingSession(true);
  try {
    const response = await fetch(`/api/jobs/${params.id}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: params.id,
        questionCount: isPro ? 10 : 3, // Based on plan
      }),
    });

    if (!response.ok) throw new Error('Failed to start session');

    const session = await response.json();

    // Navigate to interview page
    router.push(`/jobs/${params.id}/mock/${session.id}`);

    trackEvent('mock_session_started', {
      jobId: params.id,
      plan: isPro ? 'pro' : 'free',
    });
  } catch (error) {
    showToast({
      message: 'Failed to start mock session. Please try again.',
      type: 'error',
    });
  } finally {
    setIsStartingSession(false);
  }
};

<Button 
  variant="primary"
  loading={isStartingSession}
  onClick={handleStartMock}
  className="w-full sm:w-auto"
>
  Start mock session
</Button>
```

---

### Example 7: View Session Report

**Current:**
```typescript
<Button variant="text">View report</Button>
```

**Production:**
```typescript
const handleViewReport = async (sessionId: string) => {
  try {
    // Option 1: Navigate to report page
    router.push(`/jobs/${params.id}/sessions/${sessionId}`);

    // Option 2: Open report in modal
    // const response = await fetch(`/api/sessions/${sessionId}/report`);
    // const report = await response.json();
    // setSelectedReport(report);
    // setShowReportModal(true);
  } catch (error) {
    showToast({
      message: 'Failed to load report. Please try again.',
      type: 'error',
    });
  }
};

<Button 
  variant="text"
  onClick={() => handleViewReport(session.id)}
>
  View report
</Button>
```

---

## Backend API Specifications

### GET /api/jobs/[id]
**Response:**
```json
{
  "id": "1",
  "company": "Acme Corporation",
  "role": "Senior Frontend Engineer",
  "status": "Applied",
  "jobDescription": "...",
  "notes": "...",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-19T14:30:00Z"
}
```

### PATCH /api/jobs/[id]
**Request:**
```json
{
  "status": "Interviewing",
  "jobDescription": "...",
  "notes": "..."
}
```

**Response:** Updated job object (same as GET)

### POST /api/jobs/[id]/tailor
**Request:**
```json
{
  "jobDescription": "...",
  "resumeId": "user-resume-123"
}
```

**Response:**
```json
{
  "keywords": [
    { "id": "1", "keyword": "GraphQL" },
    { "id": "2", "keyword": "Docker" }
  ],
  "bullets": [
    {
      "id": "1",
      "bullet": "Led redesign...",
      "category": "Performance"
    }
  ],
  "generatedAt": "2025-01-19T15:00:00Z"
}
```

### GET /api/jobs/[id]/sessions
**Response:**
```json
{
  "sessions": [
    {
      "id": "session-1",
      "date": "2025-01-10",
      "score": 78,
      "questionsAsked": 10,
      "duration": 1200,
      "completedAt": "2025-01-10T14:30:00Z"
    }
  ]
}
```

### POST /api/jobs/[id]/sessions
**Request:**
```json
{
  "jobId": "1",
  "questionCount": 10
}
```

**Response:**
```json
{
  "id": "session-123",
  "jobId": "1",
  "startedAt": "2025-01-19T15:05:00Z",
  "questions": [
    {
      "id": "q1",
      "text": "Tell me about your experience with React?",
      "followUps": []
    }
  ]
}
```

---

## Toast Notification System

Example implementation to replace console.log:

```typescript
// hooks/useToast.ts
interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  return {
    show: (toast: Toast) => {
      // Implementation: Show toast in UI
      console.log(`[${toast.type}] ${toast.message}`);
    },
  };
}

// Usage in JobDetailPage
const { show: showToast } = useToast();

const handleCopyKeyword = (keyword: string) => {
  navigator.clipboard.writeText(keyword);
  showToast({
    message: `Copied: ${keyword}`,
    type: 'success',
    duration: 2000,
  });
};
```

---

## Error Handling Pattern

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

async function handleApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall();

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    // Handle error
    if (error instanceof Error) {
      showToast({
        message: error.message,
        type: 'error',
      });
    }
    throw error;
  }
}

// Usage
const job = await handleApiCall<JobDetail>(
  () => fetch(`/api/jobs/${params.id}`)
);
```

---

## Performance Optimization Tips

### 1. Lazy Load Sessions
```typescript
// Only fetch sessions when user scrolls to that section
const observerRef = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      fetchSessions();
      observer.unobserve(entry.target);
    }
  });

  if (observerRef.current) {
    observer.observe(observerRef.current);
  }

  return () => observer.disconnect();
}, []);
```

### 2. Debounce JD Edits
```typescript
import { useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedSave = useCallback(
  debounce(async (text: string) => {
    await handleSaveJD(text);
  }, 1000),
  []
);
```

### 3. Cache API Responses
```typescript
const cache = new Map<string, CacheEntry>();

const fetchWithCache = async <T,>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> => {
  if (cache.has(key)) {
    const entry = cache.get(key)!;
    if (Date.now() - entry.timestamp < 5 * 60 * 1000) {
      return entry.data as T;
    }
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

---

## Testing Examples

### Unit Test: Copy Functionality
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('copies keyword to clipboard', async () => {
  const mockCopy = jest.spyOn(navigator.clipboard, 'writeText');
  
  render(<KeywordChip keyword="GraphQL" onCopy={jest.fn()} />);
  
  const copyButton = screen.getByRole('button');
  await userEvent.click(copyButton);
  
  await waitFor(() => {
    expect(mockCopy).toHaveBeenCalledWith('GraphQL');
  });
});
```

### Integration Test: Tailor Generation
```typescript
test('generates tailored bullets', async () => {
  const { getByText } = render(<TailorResumeModule />);
  
  const generateButton = getByText('Generate tailored bullets');
  await userEvent.click(generateButton);
  
  await waitFor(() => {
    expect(getByText(/Performance/i)).toBeInTheDocument();
  });
});
```

---

## Analytics Integration

```typescript
// Track user interactions
const trackEvent = (name: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, properties);
  }
};

// Usage
trackEvent('tailor_generated', {
  jobId: params.id,
  keywordsCount: keywords.length,
});

trackEvent('mock_started', {
  jobId: params.id,
  questionsCount: 10,
});
```

---

## Notes

- All examples maintain TypeScript type safety
- Error handling follows consistent patterns
- Loading states provide good UX
- Toast notifications provide user feedback
- Analytics tracks user engagement
- Performance optimizations are included

---

**Last Updated:** January 19, 2025
