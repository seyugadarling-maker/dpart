import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Missing authorization header" }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = await params

    const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/balance`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Update balance error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update balance",
      },
      { status: 500 },
    )
  }
}
