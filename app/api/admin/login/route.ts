import { type NextRequest, NextResponse } from "next/server"

const ADMIN_USERNAME = "AdminRio"
const ADMIN_PASSWORD = "RioBoss"
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin credentials",
        },
        { status: 401 },
      )
    }

    // Create JWT token for admin
    const token = await createToken()

    return NextResponse.json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        admin: {
          username: ADMIN_USERNAME,
          role: "admin",
        },
      },
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Admin login failed",
      },
      { status: 500 },
    )
  }
}

async function createToken() {
  const now = new Date()
  const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const token = await new (await import("jose")).SignJWT({
    username: ADMIN_USERNAME,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(exp.getTime() / 1000))
    .sign(JWT_SECRET)

  return token
}
