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
API_KEY=your_api_key

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

## License

This project is available for personal and academic use. Add a license of your choice (MIT is a common default for student/portfolio projects) before publishing publicly.
