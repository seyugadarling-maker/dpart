"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"

interface User {
  _id: string
  username: string
  email: string
  balance: number
  role: string
  createdAt: string
}

interface DashboardStats {
  totalUsers: number
  totalAdmins: number
  newUsersThisWeek: number
  totalBalance: number
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem("admin.token")
  if (!token) throw new Error("Not authenticated")

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export default function AdminDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [balanceChange, setBalanceChange] = useState<{ [key: string]: string }>({})

  const { data: statsData, isLoading: statsLoading } = useSWR("/api/admin/dashboard", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const {
    data: usersData,
    isLoading: usersLoading,
    mutate: mutateUsers,
  } = useSWR("/api/admin/users", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("admin.token")
    if (!token) {
      router.push("/admin/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("admin.token")
    localStorage.removeItem("admin.user")
    router.push("/admin/login")
  }

  const handleBalanceUpdate = async (userId: string) => {
    const amount = Number.parseFloat(balanceChange[userId] || "0")
    if (amount === 0) return

    try {
      const token = localStorage.getItem("admin.token")
      const res = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      })

      if (res.ok) {
        setBalanceChange((prev) => ({ ...prev, [userId]: "" }))
        setEditingUser(null)
        mutateUsers()
      }
    } catch (error) {
      console.error("Balance update failed:", error)
    }
  }

  if (!mounted) return null

  const stats: DashboardStats = statsData?.data?.stats || {
    totalUsers: 0,
    totalAdmins: 0,
    newUsersThisWeek: 0,
    totalBalance: 0,
  }

  const users: User[] = usersData?.data?.users || []

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
        <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
          Logout
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-full bg-slate-700" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Admin Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">{stats.totalAdmins}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">New This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.newUsersThisWeek}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">${stats.totalBalance.toFixed(2)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Users</CardTitle>
          <CardDescription className="text-slate-400">Manage user balances and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-slate-700" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Username</th>
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Balance</th>
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Role</th>
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Joined</th>
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-2 text-white">{user.username}</td>
                      <td className="py-3 px-2 text-slate-300">{user.email}</td>
                      <td className="py-3 px-2 text-white font-semibold">${user.balance.toFixed(2)}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === "admin" ? "bg-purple-900/50 text-purple-300" : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        {editingUser === user._id ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={balanceChange[user._id] || ""}
                              onChange={(e) =>
                                setBalanceChange((prev) => ({
                                  ...prev,
                                  [user._id]: e.target.value,
                                }))
                              }
                              className="w-24 h-8 bg-slate-700 border-slate-600 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleBalanceUpdate(user._id)}
                              className="bg-green-600 hover:bg-green-700 h-8"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(null)}
                              className="h-8 border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setEditingUser(user._id)}
                            className="bg-blue-600 hover:bg-blue-700 h-8"
                          >
                            Edit Balance
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
