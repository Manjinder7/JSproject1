const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Assuming a User model is defined
const router = express.Router();

// Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

// Render Login Page
router.get("/login", (req, res) => {
  const { firstName } = req.query || ""; // Safely extract firstName from query parameters
  res.render("login", { firstName }); // Render login.ejs with firstName
});

// Render Register Page
router.get("/register", (req, res) => {
  res.render("register"); // Render register.ejs
});

// Handle Registration
// Handle Registration
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  // Validate input
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).render("register", { errorMessage: "All fields are required." });
  }

  if (password !== confirmPassword) {
      return res.status(400).render("register", { errorMessage: "Passwords do not match." });
  }

  try {
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.render("register", { errorMessage: "User with this email already exists." });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const user = new User({
          firstName,
          lastName,
          email,
          password: hashedPassword,
      });

      await user.save();

      // Redirect to login page with firstName in query parameters
      res.redirect(`/api/auth/login?firstName=${encodeURIComponent(firstName)}`);
  } catch (error) {
      console.error("Registration error:", error);
      res.status(500).render("register", { errorMessage: "Internal server error. Please try again later." });
  }
});


// Handle Login
router.post("/login", async (req, res) => {
  const { email, password, stayLoggedIn } = req.body;

  // Server-side Validation
  if (!email || !password) {
    return res.status(400).render("login", { errorMessage: "Email and password are required." });
  }

  try {
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).render("login", { errorMessage: "Invalid email or password." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render("login", { errorMessage: "Invalid email or password." });
    }

    // Handle persistent login
    if (stayLoggedIn) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("jwt", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
    } else {
      req.session.user = {
        id: user._id,
        name: user.firstName,
      };
    }

    res.redirect("/"); // Redirect to the homepage
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).render("login", { errorMessage: "Internal server error. Please try again later." });
  }
});

module.exports = router;
