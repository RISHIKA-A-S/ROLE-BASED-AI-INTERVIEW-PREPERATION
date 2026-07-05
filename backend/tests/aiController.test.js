const { conceptExplainPrompt, questionAnswerPrompt } = require("../utils/prompts");

// Optional dependency: `npm install jsonrepair`
// Used as a last-resort fix for truncated/malformed JSON before we give up.
let jsonrepair;
try {
    ({ jsonrepair } = require("jsonrepair"));
} catch (e) {
    jsonrepair = null;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const TOGETHER_API_URL = process.env.TOGETHER_API_URL || "https://api.together.ai/v1/chat/completions";
const TOGETHER_MODEL = process.env.TOGETHER_MODEL || "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
const AI_PROVIDER = (process.env.AI_PROVIDER || "groq").toLowerCase();

// Explanations tend to run longer than Q&A pairs (code snippets, bullet points),
// so give them more headroom than the default to avoid truncated JSON.
const EXPLANATION_MAX_TOKENS = 2200;

// Each detailed Q&A pair (question + beginner-friendly answer + example/pseudo-code)
// tends to run ~250-400 tokens. Rather than trying to guess one big enough
// max_tokens value for the *whole* request (which breaks down whenever the
// model is more verbose than expected, or numberOfQuestions is large), we
// generate questions in small batches and merge them. Each batch gets a
// generous, easily-achievable budget, so a single completion is very
// unlikely to be truncated, and if one batch does fail we don't lose the
// whole request.
const QUESTIONS_PER_BATCH = 4;
const TOKENS_PER_BATCH = 2200;

const getAIText = async (prompt, { maxTokens = TOKENS_PER_BATCH, forceJsonMode = false } = {}) => {
    if (AI_PROVIDER === "groq" && GROQ_API_KEY) {
        const body = {
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: maxTokens,
        };

        // Groq supports OpenAI-style JSON mode, which guarantees syntactically
        // valid JSON output (fixes unescaped-quote / malformed-JSON failures).
        // The prompt must already instruct the model to return JSON for this to work.
        if (forceJsonMode) {
            body.response_format = { type: "json_object" };
        }

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || "";
    }

    if (TOGETHER_API_KEY) {
        const body = {
            model: TOGETHER_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: maxTokens,
        };

        const response = await fetch(TOGETHER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOGETHER_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Together API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || "";
    }

    throw new Error("No AI provider API key is configured. Set GROQ_API_KEY or TOGETHER_API_KEY.");
};

// LLMs frequently "pretty print" JSON string values with real line breaks
// instead of escaping them as \n, e.g. "explanation": "Line one.
// Line two." — this is invalid JSON (raw control characters aren't allowed
// inside a JSON string) even though braces/brackets stay perfectly balanced.
// This walks the text tracking whether we're inside a string literal and
// escapes any raw newline/carriage-return/tab it finds there, leaving
// structural whitespace (outside strings) untouched.
const sanitizeControlCharsInStrings = (text) => {
    if (typeof text !== "string" || !text) {
        return text;
    }

    let result = "";
    let inString = false;
    let escaped = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];

        if (inString) {
            if (escaped) {
                result += char;
                escaped = false;
                continue;
            }

            if (char === "\\") {
                result += char;
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = false;
                result += char;
                continue;
            }

            if (char === "\n") {
                result += "\\n";
                continue;
            }

            if (char === "\r") {
                result += "\\r";
                continue;
            }

            if (char === "\t") {
                result += "\\t";
                continue;
            }

            result += char;
            continue;
        }

        if (char === '"') {
            inString = true;
        }

        result += char;
    }

    return result;
};

const tryParseJson = (text) => {
    if (typeof text !== "string" || !text.trim()) {
        return null;
    }

    const candidates = [];
    const trimmed = text.trim();
    candidates.push(trimmed);

    const withoutFences = trimmed.replace(/```(?:json|javascript)?\s*/gi, "").replace(/```/g, "");
    if (withoutFences !== trimmed) {
        candidates.push(withoutFences.trim());
    }

    const withTrailingCommaFixes = withoutFences.replace(/,\s*([}\]])/g, "$1");
    if (withTrailingCommaFixes !== withoutFences) {
        candidates.push(withTrailingCommaFixes.trim());
    }

    // Try each existing candidate again after escaping stray control
    // characters found inside string literals (handles the common
    // "pretty-printed multi-line string value" failure mode).
    const sanitizedCandidates = candidates
        .map(sanitizeControlCharsInStrings)
        .filter((candidate) => !candidates.includes(candidate));
    candidates.push(...sanitizedCandidates);

    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate);
        } catch (error) {
            // Try next candidate
        }
    }

    return null;
};

const extractBalancedJsonCandidate = (text) => {
    if (typeof text !== "string" || !text.trim()) {
        return null;
    }

    const trimmed = text.trim();
    const stack = [];
    let inString = false;
    let escaped = false;
    let startIndex = -1;

    for (let index = 0; index < trimmed.length; index += 1) {
        const char = trimmed[index];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === "\\") {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === "{" || char === "[") {
            if (stack.length === 0) {
                startIndex = index;
            }
            stack.push(char);
            continue;
        }

        if (char === "}" || char === "]") {
            const expected = char === "}" ? "{" : "[";
            if (stack[stack.length - 1] === expected) {
                stack.pop();
                if (stack.length === 0 && startIndex !== -1) {
                    return trimmed.slice(startIndex, index + 1);
                }
            }
        }
    }

    return null;
};

// Last-resort repair for JSON that's truncated, has trailing commas,
// or contains minor structural issues that jsonrepair can fix but our
// hand-rolled parsers above cannot (e.g. unescaped quotes inside strings
// in some cases, unterminated strings/objects from truncated responses).
const tryRepairJson = (text) => {
    if (!jsonrepair || typeof text !== "string" || !text.trim()) {
        return null;
    }

    // jsonrepair is very lenient: given plain prose with no JSON structure at
    // all, it will happily wrap it into a JSON string literal instead of
    // failing. Only attempt repair when the text actually looks like it
    // contains an object/array, otherwise we'd turn "no JSON found" into a
    // false positive.
    if (!/[{[]/.test(text)) {
        return null;
    }

    try {
        const repaired = jsonrepair(text.trim());
        const parsed = JSON.parse(repaired);

        // Guard against jsonrepair/JSON.parse succeeding but producing a
        // primitive (string/number/bool) rather than the object/array we need.
        if (parsed === null || typeof parsed !== "object") {
            return null;
        }

        return parsed;
    } catch (error) {
        return null;
    }
};

const extractJsonPayload = (rawText) => {
    if (typeof rawText !== "string" || !rawText.trim()) {
        return null;
    }

    const cleanedText = rawText.trim();

    const directParse = tryParseJson(cleanedText);
    if (directParse !== null) {
        return directParse;
    }

    const fencedMatch = cleanedText.match(/```(?:json|javascript)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
        const fencedParse = tryParseJson(fencedMatch[1]);
        if (fencedParse !== null) {
            return fencedParse;
        }
    }

    const balancedCandidate = extractBalancedJsonCandidate(cleanedText);
    if (balancedCandidate) {
        const parsedCandidate = tryParseJson(balancedCandidate);
        if (parsedCandidate !== null) {
            return parsedCandidate;
        }
    }

    const firstArrayBracket = cleanedText.indexOf("[");
    const lastArrayBracket = cleanedText.lastIndexOf("]");
    if (firstArrayBracket !== -1 && lastArrayBracket > firstArrayBracket) {
        const arrayParse = tryParseJson(cleanedText.slice(firstArrayBracket, lastArrayBracket + 1));
        if (arrayParse !== null) {
            return arrayParse;
        }
    }

    const firstObjectBrace = cleanedText.indexOf("{");
    const lastObjectBrace = cleanedText.lastIndexOf("}");
    if (firstObjectBrace !== -1 && lastObjectBrace > firstObjectBrace) {
        const objectParse = tryParseJson(cleanedText.slice(firstObjectBrace, lastObjectBrace + 1));
        if (objectParse !== null) {
            return objectParse;
        }
    }

    // Final fallback: try jsonrepair on the whole text, then on the best
    // balanced/bracket-sliced candidate we could find above.
    const repairedFromFull = tryRepairJson(cleanedText);
    if (repairedFromFull !== null) {
        return repairedFromFull;
    }

    if (balancedCandidate) {
        const repairedFromBalanced = tryRepairJson(balancedCandidate);
        if (repairedFromBalanced !== null) {
            return repairedFromBalanced;
        }
    }

    return null;
};

const normalizeQuestionsPayload = (data) => {
    if (Array.isArray(data)) {
        return data
            .filter(Boolean)
            .map((item) => {
                if (typeof item === "string") {
                    return { question: item, answer: "" };
                }

                if (item?.question || item?.answer) {
                    return {
                        question: item.question || "",
                        answer: item.answer || item.explanation || "",
                    };
                }

                return null;
            })
            .filter(Boolean);
    }

    if (data?.questions && Array.isArray(data.questions)) {
        return normalizeQuestionsPayload(data.questions);
    }

    return [];
};

const normalizeExplanationPayload = (data) => {
    if (data && typeof data === "object") {
        if (typeof data.explanation === "string" || typeof data.title === "string") {
            return {
                title: data.title || "Concept Overview",
                explanation: data.explanation || data.summary || "",
            };
        }
    }

    return null;
};

// Minimum lengths below which a question/answer pair is more likely to be
// jsonrepair having patched over genuine truncation (e.g. an answer that got
// cut off mid-sentence and was then closed off with a fabricated short
// string) than an actual complete response. Real answers from these prompts
// run to multiple sentences, so this threshold is conservative.
const MIN_QUESTION_LENGTH = 8;
const MIN_ANSWER_LENGTH = 20;

const isCompletePair = (item) =>
    typeof item?.question === "string" &&
    item.question.trim().length >= MIN_QUESTION_LENGTH &&
    typeof item?.answer === "string" &&
    item.answer.trim().length >= MIN_ANSWER_LENGTH;

// Generates one batch of `count` questions and returns a normalized array,
// or throws if this batch could not be produced after a retry.
const generateQuestionBatch = async (role, experience, topicsToFocus, count) => {
    const prompt = questionAnswerPrompt(role, experience, topicsToFocus, count);

    const attempt = async () => {
        const rawText = await getAIText(prompt, {
            maxTokens: TOKENS_PER_BATCH,
            forceJsonMode: true,
        });

        if (!rawText.trim()) {
            throw new Error("Empty AI response for question batch");
        }

        const parsedData = extractJsonPayload(rawText);
        if (parsedData === null) {
            console.error("AI response parse failed for question batch:", rawText);
            throw new Error("Could not parse AI response for question batch");
        }

        const normalized = normalizeQuestionsPayload(parsedData);
        const complete = normalized.filter(isCompletePair);

        if (!complete.length) {
            console.error("AI response for question batch had no complete Q&A pairs (likely truncated):", rawText);
            throw new Error("AI response contained no complete questions for this batch");
        }

        return complete;
    };

    try {
        return await attempt();
    } catch (firstError) {
        // One retry per batch — a single bad/truncated completion shouldn't
        // sink the whole request when a second try is cheap and likely to
        // succeed (temperature 0.7 means the retry isn't a carbon copy).
        try {
            return await attempt();
        } catch (secondError) {
            console.error("Question batch failed after retry:", secondError);
            throw secondError;
        }
    }
};

// @desc    Generate interview questions and answers using the configured AI provider
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
    try {
        const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

        if( !role || !experience || !topicsToFocus || !numberOfQuestions ){
            return res.status(400).json({ message: "Missing required fields"});
        }

        const totalRequested = Math.max(1, Number(numberOfQuestions) || 0);
        if (!totalRequested) {
            return res.status(400).json({ message: "numberOfQuestions must be a positive number" });
        }

        // Split into small batches so no single completion has to carry the
        // whole request — this is what actually prevents truncation, rather
        // than trying to guess one large-enough max_tokens value up front.
        const batchSizes = [];
        let remaining = totalRequested;
        while (remaining > 0) {
            const size = Math.min(QUESTIONS_PER_BATCH, remaining);
            batchSizes.push(size);
            remaining -= size;
        }

        const batchResults = await Promise.allSettled(
            batchSizes.map((size) => generateQuestionBatch(role, experience, topicsToFocus, size))
        );

        const normalizedQuestions = batchResults
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => result.value);

        const failedBatchCount = batchResults.filter((result) => result.status === "rejected").length;
        if (failedBatchCount > 0) {
            console.error(`${failedBatchCount} of ${batchSizes.length} question batch(es) failed.`);
        }

        if (!normalizedQuestions.length) {
            return res.status(502).json({ message: "The AI service did not return any interview questions. Please try again." });
        }

        // Trim in case the model over-delivered within a batch (e.g. asked for
        // 4, returned 5) so the final count matches what was requested.
        res.status(200).json(normalizedQuestions.slice(0, totalRequested));
    } catch (error) {
        console.error("Question generation error:", error);
        res.status(500).json({ message: "Failed to generate interview questions." });
    }
};


// @desc    Generate an explanation for an interview question using the configured AI provider
// @route   POST /api/ai/generate-explanation
// @access  Private
const generateConceptExplanation = async (req, res) => {
    try {
        const { question } = req.body;
        if(!question){
            return res.status(400).json({ message: "Missing required fields" });
        }

        const prompt = conceptExplainPrompt(question);

        let rawText = "";
        try {
            // Explanations run longer (code snippets, bullet points) and are more
            // prone to unescaped-quote JSON errors, so use JSON mode + more tokens.
            rawText = await getAIText(prompt, { maxTokens: EXPLANATION_MAX_TOKENS, forceJsonMode: true });
        } catch (aiError) {
            console.error("AI explanation generation failed:", aiError);
            return res.status(502).json({ message: "The AI service is currently unavailable. Please try again in a moment." });
        }

        if (!rawText.trim()) {
            return res.status(502).json({ message: "The AI service returned an empty response. Please try again." });
        }

        const parsedData = extractJsonPayload(rawText);
        if (parsedData === null) {
            console.error("AI explanation parse failed:", rawText);
            return res.status(502).json({ message: "The AI service returned an invalid response. Please try again." });
        }

        const normalizedExplanation = normalizeExplanationPayload(parsedData);
        if (!normalizedExplanation) {
            return res.status(502).json({ message: "The AI service did not return a valid explanation. Please try again." });
        }

        res.status(200).json(normalizedExplanation);
    } catch (error) {
        console.error("Explanation generation error:", error);
        res.status(500).json({ message: "Failed to generate explanation." });
    }
};

module.exports = { extractJsonPayload, generateInterviewQuestions, generateConceptExplanation };