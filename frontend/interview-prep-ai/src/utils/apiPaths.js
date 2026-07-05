const DEFAULT_API_BASE_URL =
    typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "https://ai-powered-interview-prep-app-bbb.onrender.com";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register", // Signup
        LOGIN: "/api/auth/login", // Authenticate user & return JWT token
        GET_PROFILE: "/api/auth/profile" // Get logged-in user details
        ,
        UPDATE_PROFILE: "/api/auth/profile"
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image", // Upload profile picture
    },

    AI: {
        GENERATE_QUESTIONS: "/api/ai/generate-questions", // Generate interview questions and answers using Gemini
        GENERATE_EXPLANATION: "/api/ai/generate-explanation", // Generate concept explanation using Gemini
    },

    SESSION: {
        CREATE: "/api/sessions/create", // Create a new interview session with questions
        GET_ALL: "/api/sessions/my-sessions", // Get all user sessions
        GET_ONE: (id) => `/api/sessions/${id}`, // Get session details with questions
        DELETE: (id) => `/api/sessions/${id}`, // Delete a session
    },

    QUESTION: {
        ADD_TO_SESSION: "/api/questions/add", // Add more questions to a session
        PIN: (id) => `/api/questions/${id}/pin`, // Pin or Unpin a question
        UPDATE_NOTE: (id) => `/api/questions/${id}/note`, // Update/Add a note to a question
    },
};
