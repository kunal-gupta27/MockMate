# 🤖 MockMate — AI-Powered Mock Interview Platform

MockMate is a production-ready AI-powered mock interview platform built using the MERN stack and Gemini API.  
It helps users practice technical interviews through AI-generated questions, real-time speech interaction, coding rounds, resume-based interview generation, and automated AI feedback.

The platform simulates real-world interview experiences with secure authentication, responsive UI, voice interaction, and intelligent performance evaluation.

---

## 🚀 Key Features

### 🎤 AI Mock Interviews

* AI-generated technical interview questions
* Role-specific and resume-based interview generation
* Real-time speech-to-text interaction
* AI-driven interview feedback system

### 💻 Coding Interview Environment

* Integrated coding editor for technical rounds
* Supports real-time coding practice
* Interactive coding interview workflow

### 📄 Resume Analysis

* Upload resumes for personalized interview generation
* Extracts resume-based interview questions
* Smart interview customization using AI

### 🔐 Authentication & Security

* Secure JWT-based authentication
* Protected routes and session management
* Login & signup functionality

### 🎨 UI/UX

* Fully responsive modern UI
* Smooth animations using Framer Motion
* Clean dashboard and interview workflow

### ☁️ Cloud & Deployment

* Frontend deployed on Vercel
* Backend deployment support using Render
* Cloud-based scalable architecture

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Material UI
* Framer Motion
* React Router DOM
* Axios
* React Speech Recognition

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer
* Nodemailer

### AI & APIs

* Gemini API
* Speech Recognition API

### Deployment

* Vercel
* Render

---

## 🧱 Architecture & Concepts

* MERN Stack Architecture
* RESTful API Design
* JWT Authentication
* Protected Routes
* Speech Recognition Integration
* AI-Powered Interview Generation
* Resume Parsing Workflow
* Responsive Design Principles

---

## 📂 Project Structure

```bash
MockMate/
│
├── Backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── package.json
│
├── FrontEnd/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/kunal-gupta27/MockMate.git
cd MockMate
```

---

### 2️⃣ Frontend Setup

```bash
cd FrontEnd
npm install
npm run dev
```

---

### 3️⃣ Backend Setup

```bash
cd Backend
npm install
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file inside the Backend folder.

```env
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

## ⚠️ Common Issues

### ❌ Speech Recognition Not Working

* Use Google Chrome browser
* Allow microphone permissions
* Ensure HTTPS or localhost is used

### ❌ AI Responses Not Generating

* Check Gemini API key
* Verify backend environment variables

### ❌ Resume Upload Failing

* Ensure Cloudinary configuration is correct
* Check multer middleware setup

---

## 🔮 Future Improvements

* 🎥 AI-based video interview system
* 🧠 AI confidence & emotion analysis
* 🌍 Multi-language interview support
* 📊 Advanced interview analytics dashboard
* 🧑‍💻 Live collaborative coding interviews
* 🗣️ Real-time AI voice interviewer
* 🏆 Leaderboard & performance ranking
* 📈 Personalized AI learning roadmap
* 📅 Interview scheduling system

---

## 📈 Why This Project Stands Out

* Real-world AI integration using Gemini API
* Speech recognition powered interview system
* Production-ready MERN architecture
* Secure authentication & protected workflows
* Resume-based personalized interview generation
* Clean scalable frontend & backend structure
* End-to-end full-stack implementation

---

## 👨‍💻 Author

**Kunal Gupta**

GitHub:  
https://github.com/kunal-gupta27

LinkedIn:  
https://linkedin.com/in/kunal-gupta-33a434258

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
