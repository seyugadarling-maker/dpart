const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { adminAuth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/admin/users
// @desc    Get all users (sorted by newest registrations)
// @access  Private (Admin only)
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select("-password")

    res.json({
      success: true,
      data: {
        users,
        totalUsers: users.length,
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    })
  }
})

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin only)
router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({})
    const totalAdmins = await User.countDocuments({ role: "admin" })
    const newUsersThisWeek = await User.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })
    const totalBalance = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
        },
      },
    ])

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          newUsersThisWeek,
          totalBalance: totalBalance[0]?.totalBalance || 0,
        },
      },
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard stats",
    })
  }
})

// @route   PUT /api/admin/users/:userId/balance
// @desc    Update user balance (increase or decrease)
// @access  Private (Admin only)
router.put(
  "/users/:userId/balance",
  adminAuth,
  [body("amount").isFloat({ min: -999999, max: 999999 }).withMessage("Invalid amount")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { userId } = req.params
      const { amount } = req.body

      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      const previousBalance = user.balance
      user.balance = Math.max(0, user.balance + amount)

      await user.save()

      res.json({
        success: true,
        message: `Balance updated from $${previousBalance} to $${user.balance}`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            previousBalance,
          },
        },
      })
    } catch (error) {
      console.error("Update balance error:", error)
      res.status(500).json({
        success: false,
        message: "Server error while updating balance",
      })
    }
  },
)

// @route   POST /api/admin/users/:userId/admin
// @desc    Grant or revoke admin privileges
// @access  Private (Admin only)
router.post("/users/:userId/admin", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params
    const { grantAdmin } = req.body

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify your own admin status",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    user.role = grantAdmin ? "admin" : "user"
    await user.save()

    res.json({
      success: true,
      message: `${grantAdmin ? "Admin privileges granted" : "Admin privileges revoked"}`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Admin toggle error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating admin status",
    })
  }
})

module.exports = router
