# Role Based Interview Prep AI

**Practice smarter.** An AI-powered interview preparation platform that generates role-specific interview questions with detailed, beginner-friendly answers, lets you dive deeper into any concept with instant AI explanations, and tracks your prep momentum with a GitHub-style activity streak.

---

## Features

- **Tailored practice sessions** — generate a set of interview Q&A pairs for any role, experience level, and focus topics (e.g. "Frontend Developer", 2 years, "React, CSS, JavaScript").
- **Instant concept explanations** — expand any question to get an in-depth, beginner-friendly breakdown of the underlying concept, generated on demand.
- **Pin & annotate** — pin important questions to the top of a session and attach personal notes for later review.
- **Session management** — create, view, and delete practice sessions from a dashboard; each session remembers its role, topics, experience level, and question set.
- **Practice streak tracking** — a GitHub-style contribution heatmap on the profile page visualizes daily practice activity, with current-streak and longest-streak stats computed from real session history.
- **Authentication** — JWT-based signup/login with profile picture upload.
- **Resilient AI generation** — question generation is batched and automatically retries incomplete/truncated responses, so large requests don't silently fail (see [Notable Engineering Details](#notable-engineering-details)).

---

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- React Router
- Axios
- react-hot-toast, react-icons, moment

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Groq API (primary) / Together AI (fallback) for LLM-generated questions and explanations

---

## Project Structure

```
AI-Powered-Interview-Prep-App/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── aiController.js        # Groq/Together integration, JSON parsing & repair, batched generation
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   └── questionController.js
│   ├── middlewares/
│   │   └── authMiddleware.js      # JWT protect middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   └── Question.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── questionRoutes.js
│   ├── utils/
│   │   └── prompts.js             # LLM prompt templates
│   ├── uploads/                   # Uploaded profile images (static)
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Cards/
        │   │   ├── SummaryCard.jsx    # Session card on the dashboard
        │   │   └── QuestionCard.jsx   # Expandable Q&A card with pin/notes/learn more
        │   ├── layouts/
        │   │   └── DashboardLayout.jsx
        │   └── Modal.jsx
        ├── pages/
        │   ├── Dashboard/
        │   │   ├── Dashboard.jsx
        │   │   └── CreateSessionForm.jsx
        │   ├── InterviewPrep/
        │   │   └── InterviewPrep.jsx      # Question list + explanation panel for a session
        │   └── Profile/
        │       └── Profile.jsx            # Profile edit + practice streak heatmap
        ├── context/
        │   └── userContext.js
        └── utils/
            ├── apiPaths.js
            ├── axiosInstance.js
            ├── data.js             # Card colors, landing page feature copy
            └── helper.js           # getInitials and other small utilities
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or Atlas)
- A [Groq](https://console.groq.com) API key (or a [Together AI](https://www.together.ai) key as a fallback provider)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# AI provider — "groq" (default) or "together"
AI_PROVIDER=groq

GROQ_API_KEY=your_groq_api_key
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.3-70b-versatile

# Optional fallback provider
TOGETHER_API_KEY=your_together_api_key
TOGETHER_API_URL=https://api.together.ai/v1/chat/completions
TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
```

Run the server:

```bash
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (optional — falls back to `localhost:8000` in dev):

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

---

## API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new account | No |
| POST | `/api/auth/login` | Authenticate and receive a JWT | No |
| GET | `/api/auth/profile` | Get the logged-in user's profile | Yes |
| PUT | `/api/auth/profile` | Update display name / profile image | Yes |
| POST | `/api/auth/upload-image` | Upload a profile picture | Yes |
| POST | `/api/ai/generate-questions` | Generate a batch of interview Q&A pairs | Yes |
| POST | `/api/ai/generate-explanation` | Generate a detailed explanation for a question | Yes |
| POST | `/api/sessions/create` | Create a new practice session | Yes |
| GET | `/api/sessions/my-sessions` | List all sessions for the logged-in user | Yes |
| GET | `/api/sessions/:id` | Get a session with its questions | Yes |
| DELETE | `/api/sessions/:id` | Delete a session and its questions | Yes |
| POST | `/api/questions/add` | Add more questions to an existing session | Yes |
| POST | `/api/questions/:id/pin` | Pin or unpin a question | Yes |
| POST | `/api/questions/:id/note` | Add/update a note on a question | Yes |

---

## Notable Engineering Details

LLM responses are inherently unreliable to parse as structured data, so `aiController.js` includes several layers of defense rather than assuming the model always returns clean JSON:

- **Batched question generation** — instead of asking for all N questions in a single completion (which risks truncation on longer requests), questions are generated in small batches of 4, run in parallel, and merged. A batch that comes back incomplete is automatically retried once before being counted as failed, and the endpoint still returns successfully as long as at least one batch succeeded.
- **JSON-mode enforcement** — requests to Groq use `response_format: { type: "json_object" }` so the model is constrained to emit syntactically valid JSON rather than relying on prompt instructions alone.
- **Control-character sanitization** — LLMs frequently "pretty-print" string values with real line breaks instead of escaping them as `\n`, which is invalid JSON even though brackets stay balanced. A dedicated sanitizer walks the raw text and escapes stray newlines/tabs found specifically inside string literals before parsing.
- **Completeness validation** — a successfully-parsed batch is still rejected (and retried) if its question/answer pairs are suspiciously short, since JSON-repair tools can sometimes "fix" a truncated response into technically valid but semantically empty JSON.
- **`jsonrepair` fallback** — as a last resort, the `jsonrepair` package attempts to recover from trailing commas or minor structural issues before the request is given up on.

---

## License

This project is available for personal and academic use. Add a license of your choice (MIT is a common default for student/portfolio projects) before publishing publicly.
