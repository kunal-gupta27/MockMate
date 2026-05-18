const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret123", { expiresIn: '1h' });
};

// ================= TEST =================
exports.test = async (req, res) => {
  const { email, password } = req.body;
  return res.status(200).json({ email, password });
};

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email: normalizedEmail,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      message: 'User registered successfully',
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      message: 'Logged in successfully',
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= PROFILE =================
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      email: user.email,
      name: user.name,
      bio: user.bio,
      skills: user.skills,
      photoUrl: user.photoUrl,
      feedbacks: user.feedbacks
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, bio, skills, photoUrl } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.skills = skills || user.skills;
    user.photoUrl = photoUrl || user.photoUrl;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        photoUrl: user.photoUrl,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGET PASSWORD =================
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const checkUser = await User.findOne({ email: normalizedEmail });
    if (!checkUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ email: normalizedEmail }, process.env.JWT_SECRET || "secret123", { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD
      }
    });

    await transporter.sendMail({
      from: "mockAI@gmail.com",
      to: normalizedEmail,
      subject: "Password Reset",
      text: `Reset link: ${process.env.CLIENT_URL}/reset-password/${token}`
    });

    res.status(200).json({ message: "Reset link sent" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decode = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    const user = await User.findOne({ email: decode.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIX: hash new password
    user.password = password;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
