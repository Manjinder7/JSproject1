const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path"); // Import 'path' module
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Set up views and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from 'public' folder
app.use(express.static(path.join(__dirname))); // Serve static files from root directory

// Routes
app.use("/auth", authRoutes);

// Default route
app.get("/", (req, res) => {
  if (req.session.user || req.cookies.jwt) {
    res.render("index", { name: req.session.user?.name || "User" }); // If using EJS for index
    // Or, to serve index.html instead:
    // res.sendFile(path.join(__dirname, "index.html"));
  } else {
    res.redirect("/auth/login");
  }
});

// Fallback route for 404 errors
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
