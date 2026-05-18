const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {uploadRoutes} = require('./routes/uploadRoutes');
const { uploadPhoto, uploadResume } = require('./multerConfig');
const protect = require('./middleware/authMiddleware');
const User = require('./models/User');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();


const allowedOrigins = [
  'https://metahire.vercel.app',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.post('/upload-photo', uploadPhoto.single('photo'), (req, res) => {
  res.status(200).json({ message: 'Photo uploaded successfully', data: req.file });
  console.log("backend "+ JSON.stringify(req.file))
});

app.post('/upload-resume', uploadResume.single('resume'), (req, res) => {
  res.status(200).json({ message: 'Resume uploaded successfully', data: req.file });
});

// Base Route
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Initialize Google Generative AI
const getGoogleApiKey = () =>
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

const buildFallbackQuestions = (details = {}) => {
  const role = details.role || 'Software Engineer';
  const level = details.level || 'Mid-Level';
  const experience = details.experience || '2';
  const technologies = Array.isArray(details.technologies) && details.technologies.length > 0
    ? details.technologies.join(', ')
    : 'JavaScript, React, Node.js';
  const company = details.targetCompany || 'the company';

  return [
    `Tell me about yourself and why you are a good fit for the ${role} position at ${company}.`,
    `Describe a challenging project from your background that best shows your ${role} skills.`,
    `How have you used ${technologies} in past projects, and what impact did your work have?`,
    `What trade-offs do you consider when building production-ready features as a ${level} ${role}?`,
    `Describe a time you debugged a difficult issue and how you approached the solution.`,
    `How do you prioritize code quality, delivery speed, and collaboration in a team environment?`,
    `With ${experience} years of experience, what technical areas are you strongest in and where are you currently improving?`,
    `If you joined ${company}, how would you approach learning the existing codebase and shipping value quickly?`,
    `Coding Problem: Given an array of integers, return the indices of two numbers whose sum equals a target value.\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]`,
    `Coding Problem: Given a string, find the length of the longest substring without repeating characters.\nInput: "abcabcbb"\nOutput: 3`
  ];
};

const normalizeQuestions = (questions = []) =>
  questions
    .map((question) => question.replace(/^\d+[\).\s-]*/, '').trim())
    .filter(Boolean);

const parseQuestionsResponse = (rawResponse = '') => {
  const cleanedResponse = rawResponse.replace(/```json|```/g, '').trim();

  if (!cleanedResponse) {
    return [];
  }

  try {
    const parsedResponse = JSON.parse(cleanedResponse);

    if (Array.isArray(parsedResponse)) {
      return normalizeQuestions(parsedResponse.map(String));
    }

    if (Array.isArray(parsedResponse.questions)) {
      return normalizeQuestions(parsedResponse.questions.map(String));
    }
  } catch (error) {
  }

  const pipeSeparatedQuestions = normalizeQuestions(cleanedResponse.split('|'));

  if (pipeSeparatedQuestions.length > 0) {
    return pipeSeparatedQuestions;
  }

  const lineSeparatedQuestions = normalizeQuestions(
    cleanedResponse
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  );

  return lineSeparatedQuestions;
};

const normalizeFeedbackItems = (feedbackItems = [], questionsAndAnswers = []) =>
  questionsAndAnswers.map((qa, index) => {
    const item = feedbackItems[index] || {};
    const normalizedScore = Number(item.score);
    const safeScore = Number.isFinite(normalizedScore)
      ? Math.max(0, Math.min(10, Math.round(normalizedScore)))
      : 0;

    return {
      question: item.question || qa.question,
      answer: item.answer || qa.answer,
      score: safeScore,
      feedback:
        item.feedback ||
        "A more specific answer with clear examples would strengthen this response.",
    };
  });

const buildFallbackFeedback = (questionsAndAnswers = []) =>
  questionsAndAnswers.map((qa) => {
    const answer = typeof qa.answer === "string" ? qa.answer.trim() : "";
    let score = 4;
    let feedback =
      "Your answer needs more detail. Add structure, relevant examples, and a clearer explanation of your reasoning.";

    if (answer.length >= 200) {
      score = 8;
      feedback =
        "Good response. It includes useful detail and context. Make it stronger by adding measurable impact or a sharper conclusion.";
    } else if (answer.length >= 80) {
      score = 6;
      feedback =
        "Decent response. Add one concrete example and explain the result more clearly to improve it.";
    } else if (answer.length > 0) {
      score = 5;
      feedback =
        "The answer covers the basics, but it is brief. Add more depth, examples, and problem-solving details.";
    }

    if (!answer || answer === "No answer provided") {
      score = 0;
      feedback =
        "No meaningful answer was provided. Include your approach, technical reasoning, and a specific example.";
    }

    return {
      question: qa.question,
      answer: qa.answer,
      score,
      feedback,
    };
  });

// Existing Gemini API Call
app.post("/api/gemini", async (req, res) => {
  const { prompt, details } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ message: "Prompt is required." });
  }

  const apiKey = getGoogleApiKey();

  if (!apiKey) {
    return res.status(200).json({
      questions: buildFallbackQuestions(details),
      source: "fallback",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const questions = parseQuestionsResponse(responseText);

    if (questions.length === 0) {
      throw new Error("No valid interview questions were returned.");
    }

    res.status(200).json({ questions, source: "gemini" });
  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    res.status(200).json({
      questions: buildFallbackQuestions(details),
      source: "fallback",
    });
  }
});

// New API Endpoint for Scoring and Feedback
app.post("/api/gemini/feedback", async (req, res) => {
  const { questionsAndAnswers } = req.body;

  if (!Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0) {
    return res.status(400).json({ message: "questionsAndAnswers is required." });
  }

  const normalizedQuestionsAndAnswers = questionsAndAnswers.map((item) => ({
    question: typeof item?.question === "string" ? item.question.trim() : "",
    answer:
      typeof item?.answer === "string" && item.answer.trim()
        ? item.answer.trim()
        : "No answer provided",
  }));

  // Build prompt
  const prompt = `
    For the following questions and answers, provide feedback in JSON format:
    [
      {
        "question": "What is your greatest strength?",
        "answer": "I am a quick learner.",
        "score": 8,
        "feedback": "Good response, but provide specific examples."
      }
    ]

    Questions and Answers:
    ${normalizedQuestionsAndAnswers.map((qa, index) => `${index + 1}. Q: ${qa.question} A: ${qa.answer}`).join("\n")}
  `;

  try {
    const apiKey = getGoogleApiKey();

    if (!apiKey) {
      const feedback = buildFallbackFeedback(normalizedQuestionsAndAnswers);
      const totalScore = feedback.reduce((sum, item) => sum + (item.score || 0), 0);
      return res.status(200).json({ feedback, totalScore, source: "fallback" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);


    let rawResponse = result.response.text();

    // Remove code block markers (e.g., ```json and ```)
    rawResponse = rawResponse.replace(/```json|```/g, "").trim();

    // Initialize a variable to hold the parsed feedback
    let feedback;

    try {
      // Parse the raw response as JSON
      const parsedOnce = JSON.parse(rawResponse);

      // Check if the parsed content is still a stringified JSON
      if (typeof parsedOnce === "string") {
        feedback = JSON.parse(parsedOnce); // Parse again
      } else {
        feedback = parsedOnce; // Already a JSON object
      }
    } catch (err) {
      console.error("Error parsing Gemini API response:", err.message);
      feedback = buildFallbackFeedback(normalizedQuestionsAndAnswers);
    }

    if (!Array.isArray(feedback)) {
      feedback = buildFallbackFeedback(normalizedQuestionsAndAnswers);
    }

    feedback = normalizeFeedbackItems(feedback, normalizedQuestionsAndAnswers);
    const totalScore = feedback.reduce((sum, item) => sum + (item.score || 0), 0);

    res.json({ feedback, totalScore });
  } catch (error) {
    console.error("Error calling Gemini API for feedback:", error.message);
    const feedback = buildFallbackFeedback(normalizedQuestionsAndAnswers);
    const totalScore = feedback.reduce((sum, item) => sum + (item.score || 0), 0);
    res.status(200).json({ feedback, totalScore, source: "fallback" });
  }
});


app.post("/api/user/feedback", protect, async (req, res) => {
  try {
    const  userId  = req.user.id; // Extract userId from the token
    const {feedback, totalScore, role, company, createdAt } = req.body;
    
    const feedbacks = feedback;
    // Update the user document with feedback
    const user = await User.findById(userId);
    await User.findByIdAndUpdate(userId, {
      $push: {
        feedbacks: {
          feedbacks,
          totalScore,
          role,
          company,
          createdAt,
        },
      },
    });
  
    res.status(200).json({ message: "Feedback saved successfully" });
  } catch (error) {
    console.error("Error saving feedback:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/user/get-feedback", protect, async (req, res) => {
  try {
    const userId = req.user.id; 
    const user = await User.findById(userId); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user); 
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});





// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
