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
const notFound = require("./middleware/notFound")
const errorHandler = require("./middleware/errorHandler")

const app = express()

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

// Other middleware and routes can be added here

// Routes
app.use("/auth", authRoutes)
app.use("/servers", serverRoutes)
app.use("/profile", profileRoutes)
app.use("/admin", adminRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
