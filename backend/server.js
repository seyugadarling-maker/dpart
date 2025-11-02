const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const serverRoutes = require("./routes/servers")
const profileRoutes = require("./routes/profile")
const adminRoutes = require("./routes/admin")
const { notFound, errorHandler } = require("./middleware/errorHandler")

const app = express()

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

// CORS middleware
app.use(cors())

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
  })

// Routes
app.use("/auth", authRoutes)
app.use("/servers", serverRoutes)
app.use("/profile", profileRoutes)
app.use("/admin", adminRoutes)

// Error handling middleware (must be last)
app.use(notFound)
app.use(errorHandler)

// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
