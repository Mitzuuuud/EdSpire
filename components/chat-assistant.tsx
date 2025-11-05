"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { useRouter } from "next/navigation"
import { PlanningDiagram } from "@/components/planning-diagram"
import { bookSession, createSessionTimes, getUserSessions, findAvailableTimeSlot, BookedSession } from "@/lib/session-booking"

type Granularity = "day" | "week" | "month"
type Mode = "default" | "planning" | "tutor" | "practice"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  mode?: Mode
}

const suggestionChips = [
  { text: "Make study plan", icon: Sparkles },
  { text: "Find Algebra tutor", icon: Sparkles },
  { text: "Schedule 1-hr session", icon: Sparkles },
  { text: "Review my progress", icon: Sparkles },
  { text: "Help with homework", icon: Sparkles },
  { text: "Practice problems", icon: Sparkles },
] as const

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
}

// ---------- parsing + normalization helpers ----------

const parseTimeframe = (s: string): { unit: Granularity; count: number } => {
  const m = s.match(/(\d+)\s*(day|week|month)s?\b/i)
  if (m) {
    const count = Math.max(1, parseInt(m[1], 10))
    const unit = m[2].toLowerCase() as Granularity
    return { unit, count }
  }
  if (/\bmonth\b/i.test(s)) return { unit: "month", count: 1 }
  if (/\bweek\b/i.test(s)) return { unit: "week", count: 1 }
  if (/\bday\b/i.test(s)) return { unit: "day", count: 1 }
  return { unit: "week", count: 1 }
}

const cleanFmt = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`+/g, "")
    .replace(/^\s*[-•*]\s*[-•*]\s*/gm, "- ")
    .replace(/\s+-\s*(goal|tasks?)\s*:/gi, (_, k) => `\n- ${k[0].toUpperCase()}${k.slice(1)}:`)
    .replace(/:\s*-\s+/g, ":\n- ")
    .trim()

// remove generic boilerplate that the model sometimes emits
const stripBoilerplate = (s: string) =>
  s
    .replace(/here[’'`]s your focused.*?plan.*?:?/gi, "")
    .replace(/^(?:here[’'`]s|this is)\b.+$/gim, "")
    .replace(/^\s*Day\s+\d+\s*:\s*Here[’'`]s your focused.*$/gim, "")
    .trim()

const stripHdr = (s: string) => s.replace(/^(month|week|day)\s*\d+\s*:?\s*/i, "").trim()
const stripCtl = (s: string) => s.replace(/^(-\s*)?(goal|tasks?)\s*:\s*/i, "").trim()

const firstSentence = (s: string) => {
  const flat = s.replace(/\n+/g, " ").trim()
  const m = flat.match(/^(.*?)[.!?](\s|$)/)
  return (m ? m[1] : flat).trim()
}

// rejects placeholders and leaked headers
const isBad = (s: string) => {
  const x = (s || "").trim()
  return (
    !x ||
    x === "-" ||
    /^week\s*\d+\b/i.test(x) ||
    /^day\s*\d+\b/i.test(x) ||
    /^goal\s*:?\b/i.test(x) ||
    /^tasks?\s*:?\b/i.test(x)
  )
}

// split accidental "Goal: - Tasks:" mashups and trim
const fixGoalTasksMash = (s: string) =>
  s
    .replace(/-\s*Tasks?:?.*$/i, "") // drop anything after " - Tasks:"
    .replace(/\s*Tasks?:?.*$/i, "") // or "Tasks:" on same line
    .trim()

// parse explicit Day blocks
const parseDayBlocks = (txt: string) => {
  const re = /day\s*(\d+)\s*:?\s*([\s\S]*?)(?=day\s*\d+\s*:|week\s*\d+\s*:|$)/gi
  const out: Array<{ n: number; raw: string }> = []
  for (const m of txt.matchAll(re)) out.push({ n: +m[1], raw: (m[2] || "").trim() })
  return out.sort((a, b) => a.n - b.n)
}

// parse Week blocks when model uses Week headers
const parseWeekBlocks = (txt: string) => {
  const re = /week\s*(\d+)\s*:?\s*([\s\S]*?)(?=week\s*\d+\s*:|$)/gi
  const out: Array<{ n: number; raw: string; title?: string }> = []
  for (const m of txt.matchAll(re)) {
    const raw = (m[2] || "").trim()
    const header = (m[0] || "").split("\n")[0]
    const title = stripHdr(header.replace(/week\s*\d+\s*:?\s*/i, "")).trim()
    out.push({ n: +m[1], raw, title })
  }
  return out.sort((a, b) => a.n - b.n)
}

const bulletsFrom = (txt: string) =>
  txt
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*•]/.test(l))
    .map((l) => l.replace(/^[-*•]\s?/, "").trim())
    .map(stripHdr)
    .map(stripCtl)
    .filter(Boolean)
    .filter((l) => !/focused .* plan/i.test(l) && !/^goal\s*:/i.test(l) && !/^tasks?\s*:/i.test(l))

const dedupe = (arr: string[]) => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of arr) {
    const k = cleanFmt(t).toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(cleanFmt(t))
  }
  return out
}

const makeBlock = (label: string, raw: string, fallbackTitle?: string) => {
  const base = stripBoilerplate(cleanFmt(raw))

  // Title
  const firstLine = stripHdr(base.split("\n")[0]).replace(/\s*-\s*(goal|tasks?)\s*:.*$/i, "").trim()
  let title = firstLine || fallbackTitle || stripHdr(stripCtl(firstSentence(base)))
  if (isBad(title)) title = fallbackTitle || "Study Focus"

  // Goal
  const goalLineMatch = [...base.matchAll(/^\s*-?\s*goal\s*:\s*(.+)$/gim)]
  let goal = goalLineMatch.length ? cleanFmt(goalLineMatch[0][1]) : stripCtl(firstSentence(base))
  goal = fixGoalTasksMash(goal)
  if (isBad(goal)) goal = `Make progress on: ${title}`

  // Tasks
  const tasksSrc = base.split(/^\s*tasks?\s*:\s*$/im).slice(1).join("\n") || base
  let tasks = dedupe(
    bulletsFrom(tasksSrc).filter((t) => {
      const k = t.toLowerCase()
      return k && k !== title.toLowerCase() && k !== goal.toLowerCase()
    })
  )

  if (tasks.length === 0) {
    // derive from sentences if no bullets
    const sentences = base
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 6 && !isBad(s))
    tasks = sentences.slice(0, 3)
  }

  if (tasks.length === 0) {
    tasks = ["Study 30–45 min", "Do 2–3 practice problems", "Write a 3-bullet recap"]
  } else if (tasks.length > 3) {
    tasks = tasks.slice(0, 3)
  }

  return [`${label}: ${title}`, `- Goal: ${goal}`, `- Tasks:`, ...tasks.map((t) => `  - ${t}`)].join("\n")
}

function normalizePlan(rawIn: string, g: Granularity, units: number): string {
  const raw = stripBoilerplate(cleanFmt(rawIn))

  if (g === "month") {
    const blocksNeeded = Math.max(4, units * 4)
    const weekBlocks = parseWeekBlocks(raw)
    if (weekBlocks.length) {
      // Return exactly N week blocks (rotate if fewer)
      const out: string[] = []
      for (let i = 0; i < blocksNeeded; i++) {
        const wb = weekBlocks[i] ?? weekBlocks[i % weekBlocks.length]
        out.push(makeBlock(`Week ${i + 1}`, wb.raw, wb.title || `Week ${i + 1} Focus`))
      }
      return out.join("\n\n")
    }
    const parts = raw.split(/\n{2,}/).filter(Boolean)
    return Array.from({ length: blocksNeeded }, (_, i) =>
      makeBlock(`Week ${i + 1}`, parts[i % Math.max(1, parts.length)] || raw, `Week ${i + 1} Focus`)
    ).join("\n\n")
  }

  if (g === "week") {
    const blocksNeeded = Math.max(7, units * 7)

    // 1) If explicit Day blocks exist, pad/rotate to exact count
    const dayBlocks = parseDayBlocks(raw)
    if (dayBlocks.length) {
      const out: string[] = []
      for (let i = 0; i < blocksNeeded; i++) {
        const src = dayBlocks[i]?.raw ?? dayBlocks[i % dayBlocks.length].raw
        out.push(makeBlock(`Day ${i + 1}`, src))
      }
      return out.join("\n\n")
    }

    // 2) If Week blocks exist, expand each to 7 days using its content
    const weekBlocks = parseWeekBlocks(raw)
    if (weekBlocks.length) {
      const out: string[] = []
      const neededWeeks = Math.ceil(blocksNeeded / 7)
      for (let wi = 0; wi < neededWeeks; wi++) {
        const wb = weekBlocks[wi] ?? weekBlocks[wi % weekBlocks.length]
        const wkTitle = wb.title || `Week ${wi + 1} Focus`
        // split week raw into chunks; rotate within the week
        const wkChunks =
          wb.raw
            .split(/\n{2,}/)
            .map((x) => x.trim())
            .filter(Boolean) || [wb.raw]
        for (let d = 0; d < 7; d++) {
          const globalDayIdx = wi * 7 + d
          if (globalDayIdx >= blocksNeeded) break
          const src = wkChunks.length ? wkChunks[d % wkChunks.length] : wb.raw
          out.push(makeBlock(`Day ${globalDayIdx + 1}`, src, wkTitle))
        }
      }
      return out.join("\n\n")
    }

    // 3) Fallback: rotate distinct lines/bullets to avoid clones
    const lines = raw
      .split(/\n+/)
      .map((x) => stripBoilerplate(x).trim())
      .filter(Boolean)
      .filter((x) => !/focused .* plan/i.test(x))
    const chunks = lines.length ? lines : [raw]

    return Array.from({ length: blocksNeeded }, (_, i) =>
      makeBlock(`Day ${i + 1}`, chunks[i % chunks.length])
    ).join("\n\n")
  }

  // g === "day"
  const blocksNeeded = Math.max(1, units)
  const dayBlocks = parseDayBlocks(raw)
  if (dayBlocks.length) {
    const out: string[] = []
    for (let i = 0; i < blocksNeeded; i++) {
      const src = dayBlocks[i]?.raw ?? dayBlocks[i % dayBlocks.length].raw
      out.push(makeBlock(`Day ${i + 1}`, src))
    }
    return out.join("\n\n")
  }
  const parts = raw.split(/\n{2,}/).filter(Boolean)
  return Array.from({ length: blocksNeeded }, (_, i) =>
    makeBlock(`Day ${i + 1}`, parts[i % Math.max(1, parts.length)] || raw)
  ).join("\n\n")
}

// ---------- system prompt (duration-aware) ----------

const systemPrompt = (g: Granularity, units: number) =>
  `
You are a smart, encouraging AI study assistant.

MODES (detect intent):
1) Study Planning — create realistic, structured study schedules.
2) Tutor Matching — suggest tutors by subject, availability, budget.
3) Progress Tracking — analyze performance and recommend improvements.

PLANNING RULES:
- Before drafting, check user provided: subject/topic, total timeframe, daily/weekly time budget, current level.
  If anything is missing, ask 2–4 short clarifying questions and STOP.
- If info is complete, output ONLY in this schema (no extra text):

<Unit> <N>: <Title>
- Goal: <one sentence>
- Tasks:
  - <task 1>
  - <task 2>
  - <task 3>

Notes:
- <Unit> = Day/Week/Month. Default to ${g.toUpperCase()} unless user asked otherwise.
- For a month plan, output exactly ${Math.max(4, units * 4)} blocks: Week 1 … Week ${Math.max(4, units * 4)}.
- For a week plan, output exactly ${Math.max(7, units * 7)} blocks: Day 1 … Day ${Math.max(7, units * 7)}.
- For a day plan, output exactly ${Math.max(1, units)} block(s): Day 1 … Day ${Math.max(1, units)}.
- Never repeat the unit name or the goal inside the tasks.
- End with ONE short prompt only (e.g., "Want me to add this to your calendar?").

NON-PLANNING:
- Tutor Matching: list 2–4 options/criteria with availability, price, short bio.
- Progress Tracking: summarize strengths/weaknesses and 2–3 next steps.

Style: concise, positive, actionable.
`.trim()

// ---------- helpers for plan->sessions ----------

type PlanHeader = { unit: "day" | "week" | "month"; index: number; title: string }

const parsePlanHeaders = (plan: string): PlanHeader[] => {
  const re = /^(Day|Week|Month)\s+(\d+)\s*:\s*(.+)$/i
  return plan
    .split(/\r?\n/)
    .map((l) => l.trim())
    .map((line) => {
      const m = line.match(re)
      if (!m) return null
      return {
        unit: m[1].toLowerCase() as PlanHeader["unit"],
        index: parseInt(m[2], 10),
        title: m[3].trim(),
      }
    })
    .filter(Boolean) as PlanHeader[]
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const formatYmd = (d: Date) => {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${day}`
}

const DEFAULT_START_HH_MM = "19:00" // 7pm local
const DEFAULT_DURATION_HOURS = 1

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hi Alex! I'm your AI study assistant. How can I help you today?",
      timestamp: new Date(),
      suggestions: ["Make study plan", "Find Algebra tutor", "Schedule 1-hr session"],
    },
  ])
  const [mode, setMode] = useState<Mode>("default")
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [lastPlanText, setLastPlanText] = useState<string | null>(null)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; role: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) setCurrentUser(JSON.parse(userStr))
    } catch {}
  }, [])

  const isAddIntent = (s: string) =>
    ["add to calendar", "add this to calendar", "add study plan to calendar"].includes(s.trim().toLowerCase())

  const handoffPlanToSchedule = (plan: string) => {
    const qs = new URLSearchParams({ importPlan: plan }).toString()
    router.push(`/schedule?${qs}`)
  }

  const persistPlanToFirebase = async (plan: string) => {
    if (!currentUser?.uid || !currentUser?.email) {
      handoffPlanToSchedule(plan)
      return
    }

    const headers = parsePlanHeaders(plan).sort((a, b) => a.index - b.index)
    if (headers.length === 0) {
      handoffPlanToSchedule(plan)
      return
    }

    // Fetch existing sessions to check for conflicts
    const existingSessions = await getUserSessions(currentUser.uid)

    const unit = headers[0].unit
    const tomorrow = addDays(new Date(), 1)

    type Payload = Parameters<typeof bookSession>[0]
    const payloads: Payload[] = []

    if (unit === "day") {
      headers.forEach((h, i) => {
        const dayDate = addDays(tomorrow, i)
        const ymd = formatYmd(dayDate)
        // Use findAvailableTimeSlot to avoid conflicts
        const { startTime, endTime } = findAvailableTimeSlot(ymd, 19, DEFAULT_DURATION_HOURS, existingSessions)
        payloads.push({
          userId: currentUser.uid,
          tutorId: "self-study",
          tutorName: "Self Study",
          studentEmail: currentUser.email,
          subject: h.title,
          startTime,
          endTime,
          date: ymd,
          status: "scheduled",
          cost: 0,
          notes: "Auto-generated from study plan",
        })
      })
    } else if (unit === "week" || unit === "month") {
      headers.forEach((h, wi) => {
        const weekStart = addDays(tomorrow, wi * 7)
        for (let d = 0; d < 7; d++) {
          const dayDate = addDays(weekStart, d)
          const ymd = formatYmd(dayDate)
          // Use findAvailableTimeSlot to avoid conflicts
          const { startTime, endTime } = findAvailableTimeSlot(ymd, 19, DEFAULT_DURATION_HOURS, existingSessions)
          payloads.push({
            userId: currentUser.uid,
            tutorId: "self-study",
            tutorName: "Self Study",
            studentEmail: currentUser.email,
            subject: h.title,
            startTime,
            endTime,
            date: ymd,
            status: "scheduled",
            cost: 0,
            notes: `Auto-generated from ${h.unit} ${h.index}`,
          })
        }
      })
    } else {
      headers.forEach((h, i) => {
        const dayDate = addDays(tomorrow, i)
        const ymd = formatYmd(dayDate)
        // Use findAvailableTimeSlot to avoid conflicts
        const { startTime, endTime } = findAvailableTimeSlot(ymd, 19, DEFAULT_DURATION_HOURS, existingSessions)
        payloads.push({
          userId: currentUser.uid,
          tutorId: "self-study",
          tutorName: "Self Study",
          studentEmail: currentUser.email,
          subject: h.title,
          startTime,
          endTime,
          date: ymd,
          status: "scheduled",
          cost: 0,
          notes: "Auto-generated from study plan (fallback)",
        })
      })
    }

    const results = await Promise.all(payloads.map((p) => bookSession(p)))
    const failures = results.filter((r) => !r.success)

    if (failures.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          type: "assistant",
          content: `Some sessions failed to save (${failures.length}/${payloads.length}). You can refresh the Schedule to see which ones saved.`,
          timestamp: new Date(),
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          type: "assistant",
          content: `All ${payloads.length} sessions were added to your calendar starting tomorrow at ${DEFAULT_START_HH_MM}.`,
          timestamp: new Date(),
        },
      ])
    }

    router.push("/schedule")
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return
    const lc = content.toLowerCase()

    if (isAddIntent(lc)) {
      if (lastPlanText) {
        await persistPlanToFirebase(lastPlanText)
      } else {
        setMessages((p) => [
          ...p,
          {
            id: Date.now().toString(),
            type: "assistant",
            content: 'No plan yet. Try “Make study plan” first, then click Add to calendar.',
            timestamp: new Date(),
          },
        ])
      }
      return
    }

    if (lc.includes("study plan") || lc.includes("schedule")) setMode("planning")
    else if (lc.includes("tutor")) setMode("tutor")
    else if (lc.includes("practice")) setMode("practice")
    else setMode("default")

    const userMessage: Message = { id: Date.now().toString(), type: "user", content, timestamp: new Date() }
    setMessages((p) => [...p, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const { unit: granularity, count: units } = parseTimeframe(content)
      const systemMessage = { role: "system", type: "system", content: systemPrompt(granularity, units) } as any
      const current = [systemMessage, ...messages, userMessage].map((m: any) => ({
        role: m.type === "user" ? "user" : m.type === "assistant" ? "assistant" : "system",
        content: m.content,
      }))

      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: current }),
      })
      const json = await res.json()
      let assistantContent =
        json?.assistant ?? (json?.raw ? JSON.stringify(json.raw) : "Sorry — no response from the model.")

      const planningish =
        /(day|week|month)\s*\d+/i.test(assistantContent) ||
        /(^|\n)\s*-\s*goal\s*:/i.test(assistantContent) ||
        /(^|\n)\s*tasks?\s*:/i.test(assistantContent)

      if (planningish) {
        assistantContent = normalizePlan(assistantContent, granularity, units)
        setLastPlanText(assistantContent)
      }

      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: assistantContent,
          timestamp: new Date(),
          mode: planningish ? "planning" : "default",
          suggestions: planningish ? ["Add to calendar", "View diagram"] : undefined,
        },
      ])
    } catch (e) {
      setMessages((p) => [
        ...p,
        { id: (Date.now() + 2).toString(), type: "assistant", content: `Error: ${String(e)}`, timestamp: new Date() },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <Card className="h-full flex flex-col rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <span>AI Study Assistant</span>
          <Badge variant="secondary" className="ml-auto">
            Online
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 p-0 min-h-0">
        <ScrollArea className="flex-1 px-6 min-h-0">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex space-x-2 max-w-[80%] ${m.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <div className={`p-2 rounded-lg ${m.type === "user" ? "bg-primary/10" : "bg-muted"}`}>
                      {m.type === "user" ? (
                        <User className="h-4 w-4 text-primary" />
                      ) : (
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`p-3 rounded-2xl ${m.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <ReactMarkdown
                        components={{
                          p: (p) => <p className="text-sm leading-relaxed whitespace-pre-wrap" {...p} />,
                          ul: (p) => <ul className="list-disc list-inside text-sm leading-relaxed" {...p} />,
                          li: (p) => <li className="ml-4" {...p} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>

                      {m.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.suggestions.map((s) => (
                            <Button
                              key={s}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 bg-transparent"
                              onClick={async () => {
                                const sl = s.toLowerCase()
                                if (sl === "add to calendar" && lastPlanText) {
                                  await persistPlanToFirebase(lastPlanText)
                                  return
                                }
                                if (sl === "view diagram" && lastPlanText) {
                                  setDiagramOpen(true)
                                  return
                                }
                                handleSendMessage(s)
                              }}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div variants={messageVariants} initial="hidden" animate="visible" className="flex justify-start">
                <div className="flex space-x-2 max-w-[80%]">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-3 rounded-2xl bg-muted">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* bottom suggestion chips intentionally removed */}

        <div className="px-6 pb-6">
          <div className="flex space-x-2 items-end">
            <textarea
              placeholder="Ask me anything about your studies..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(inputValue)
                }
              }}
              rows={1}
              className="flex-1 resize-none max-h-40 overflow-auto rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[3rem] scrollbar-hide"
              onInput={(e) => {
                const el = e.currentTarget as HTMLTextAreaElement
                el.style.height = "auto"
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`
              }}
            />
            <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isTyping} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <PlanningDiagram open={diagramOpen} onOpenChange={setDiagramOpen} planText={lastPlanText ?? ""} />
    </Card>
  )
}
