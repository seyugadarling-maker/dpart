const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid. User not found.",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token is not valid.",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      })
    }

    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    })
  }
}

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // If decoded has username and role fields, it's an admin token
      if (decoded.username === "AdminRio" && decoded.role === "admin") {
        req.user = { _id: "admin", role: "admin", username: "AdminRio" }
        return next()
      }

      // Otherwise check if it's a user with admin role
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Token is not valid. User not found.",
        })
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated.",
        })
      }

      if (user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        })
      }

      req.user = user
      next()
    } catch (tokenError) {
      if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Token is not valid.",
        })
      }

      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired.",
        })
      }

      throw tokenError
    }
  } catch (error) {
    console.error("Admin auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    })
  }
}

module.exports = { auth, adminAuth }
