import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

export async function GET() {
  try {
    return NextResponse.redirect(`${BACKEND_URL}/api/auth/google`)
  } catch (error) {
    console.error("[v0] Google OAuth route error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to start Google OAuth",
      },
      { status: 500 },
    )
  }
}
