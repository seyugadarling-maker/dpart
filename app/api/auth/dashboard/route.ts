import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Missing authorization header" }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Dashboard route error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard. Backend may be unavailable.",
      },
      { status: 500 },
    )
  }
}
