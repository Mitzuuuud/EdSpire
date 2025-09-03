import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Users, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 border border-border/50 shadow-sm">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Button disabled size="sm" variant="outline">
              Loading...
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3.5 w-3.5" /> Filters
          </Badge>
          <Select disabled value="all">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
          </Select>
          <Select disabled value="eds">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top 3 Podium */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" /> Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Stats Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Table */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Global Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <th className="py-2 pr-3">Rank</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Subject</th>
                        <th className="py-2 pr-3">Sessions</th>
                        <th className="py-2 pr-3">Rating</th>
                        <th className="py-2 pr-3">EDS</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="py-3 pr-3">
                            <Skeleton className="h-4 w-6" />
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="py-3 pr-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="py-3 pr-3">
                            <Skeleton className="h-4 w-12" />
                          </td>
                          <td className="py-3 pr-3">
                            <Skeleton className="h-4 w-12" />
                          </td>
                          <td className="py-3 pr-3">
                            <Skeleton className="h-8 w-20 rounded-full" />
                          </td>
                          <td className="py-3">
                            <Button disabled size="sm" variant="ghost" className="h-8">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
