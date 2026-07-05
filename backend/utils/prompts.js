const questionAnswerPrompt = (role, experience, topicsToFocus, numberOfQuestions) => `
    You are an AI trained to generate technical interview questions and answers for a job interview prep app.

    Task:
    - Role: ${role}
    - Candidate Experience: ${experience} years
    - Focus Topics: ${topicsToFocus}
    - Write ${numberOfQuestions} interview questions
    - For each question, generate a detailed but beginner-friendly answer.
    - Keep the answers practical and interview-ready.
    - If helpful, include a short example or pseudo-code inside the answer.
    - Make each question distinct and relevant to the role and topics.
    - Return only valid JSON in this exact shape:
    {
        "questions": [
            {
                "question": "Question here?",
                "answer": "Answer here."
            }
        ]
    }
    Important: Do NOT add any extra text, markdown, or code fences. Only return valid JSON.
    `;

const conceptExplainPrompt = (question) => `
    You are an AI trained to generate explanations for a given interview question.

    Task:
    - Explain the following interview question and its concept in depth as if you're teaching a beginner developer.
    - Question: "${question}"
    - After the explanation, provide a short and clear title that summarizes the concept for the article or page header.
    - Keep the formatting very clean and clear.
    - Use short paragraphs and bullet points when helpful.
    - Return only valid JSON in this exact shape:

    {
        "title": "Short title here",
        "explanation": "Explanation here."
    }

    Important: Do NOT add any extra text, markdown, or code fences. Only return valid JSON.
    `;

module.exports = { questionAnswerPrompt, conceptExplainPrompt };