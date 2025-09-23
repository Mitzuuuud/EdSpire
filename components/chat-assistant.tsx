"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { useRouter } from "next/navigation"
import { PlanningDiagram } from "@/components/planning-diagram"

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

const detectGranularity = (s: string): Granularity => {
  const t = s.toLowerCase()
  if (t.includes("day")) return "day"
  if (t.includes("month")) return "month"
  return "week"
}

const requestedUnits = (prompt: string, g: Granularity): number => {
  const m = prompt.match(/(\d+)\s*(day|week|month)s?\b/i)
  if (m) {
    const n = Math.max(1, parseInt(m[1], 10))
    const unit = m[2].toLowerCase() as Granularity
    if (unit === g) return n
  }
  return 1
}

const cleanFmt = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/`+/g, "") 
    .replace(/^\s*[-•*]\s*[-•*]\s*/gm, "- ")
    .replace(/\s+-\s*(goal|tasks?)\s*:/gi, (_, k) => `\n- ${k[0].toUpperCase()}${k.slice(1)}:`)
    .replace(/:\s*-\s+/g, `:\n- `)
    .trim()

const stripHdr = (s: string) => s.replace(/^(month|week|day)\s*\d+\s*:?\s*/i, "").trim()
const stripCtl = (s: string) => s.replace(/^(-\s*)?(goal|tasks?)\s*:\s*/i, "").trim()
const firstSentence = (s: string) => {
  const flat = s.replace(/\n+/g, " ").trim()
  const m = flat.match(/^(.*?)[.!?](\s|$)/)
  return (m ? m[1] : flat).trim()
}

const bulletsFrom = (txt: string) =>
  txt.split("\n")
    .map(l => l.trim())
    .filter(l => /^[-*•]/.test(l))
    .map(l => l.replace(/^[-*•]\s?/, "").trim())
    .map(stripHdr).map(stripCtl)
    .filter(Boolean)

const parseBlocks = (txt: string, unit: "week" | "day") => {
  const re = unit === "week"
    ? /week\s*(\d+)\s*:?\s*([\s\S]*?)(?=week\s*\d+\s*:|day\s*\d+\s*:|$)/gi
    : /day\s*(\d+)\s*:?\s*([\s\S]*?)(?=day\s*\d+\s*:|week\s*\d+\s*:|$)/gi
  const out: Array<{ n: number; raw: string }> = []
  for (const m of txt.matchAll(re)) out.push({ n: +m[1], raw: (m[2]||"").trim() })
  return out.sort((a,b)=>a.n-b.n)
}

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

const makeBlock = (label: string, raw: string) => {
  const base = cleanFmt(raw)

  const goalMatches = [...base.matchAll(/^\s*-?\s*goal\s*:\s*(.+)$/gim)]
  const goal = goalMatches.length ? cleanFmt(goalMatches[0][1]) : firstSentence(base)

  const noGoals = base.replace(/^\s*-?\s*goal\s*:.+$/gim, "").trim()

  const headerLine = stripHdr(noGoals.split("\n")[0])
    .replace(/\s*-\s*(goal|tasks?)\s*:.*$/i, "")
    .trim()

  const title = headerLine || stripHdr(stripCtl(firstSentence(noGoals)))

  const tasksSrc = noGoals.split(/^\s*tasks?\s*:\s*$/im).slice(1).join("\n") || noGoals

  const tasks = dedupe(
    bulletsFrom(tasksSrc).filter(t => {
      const k = t.toLowerCase()
      return k && k !== title.toLowerCase() && k !== goal.toLowerCase()
    })
  ).slice(0, 3)

  const safeTasks = tasks.length
    ? tasks
    : ["Study 30–45 min", "Do 2–3 practice problems", "Write a 3-bullet recap"]

  return [`${label}: ${title}`, `- Goal: ${goal}`, `- Tasks:`, ...safeTasks.map(t => `  - ${t}`)].join("\n")
}

function normalizePlan(rawIn: string, g: Granularity, units: number): string {
  const raw = cleanFmt(rawIn)

  if (g === "month") {
    const blocksNeeded = Math.max(4, units * 4) 
    const blocks = parseBlocks(raw, "week")
    if (blocks.length)
      return blocks.slice(0, blocksNeeded).map((b, i) => makeBlock(`Week ${i+1}`, b.raw)).join("\n\n")
    const parts = raw.split(/\n{2,}/).filter(Boolean)
    return Array.from({ length: blocksNeeded }, (_, i) => makeBlock(`Week ${i+1}`, parts[i] || raw)).join("\n\n")
  }

  if (g === "week") {
    const blocksNeeded = Math.max(7, units * 7) 
    const blocks = parseBlocks(raw, "day")
    if (blocks.length)
      return blocks.slice(0, blocksNeeded).map((b, i) => makeBlock(`Day ${i+1}`, b.raw)).join("\n\n")
    const parts = raw.split(/\n{2,}/).filter(Boolean)
    return Array.from({ length: blocksNeeded }, (_, i) => makeBlock(`Day ${i+1}`, parts[i] || raw)).join("\n\n")
  }

  const blocksNeeded = Math.max(1, units)
  const blocks = parseBlocks(raw, "day")
  if (blocks.length)
    return blocks.slice(0, blocksNeeded).map((b, i) => makeBlock(`Day ${i+1}`, b.raw)).join("\n\n")
  const parts = raw.split(/\n{2,}/).filter(Boolean)
  return Array.from({ length: blocksNeeded }, (_, i) => makeBlock(`Day ${i+1}`, parts[i] || raw)).join("\n\n")
}


const systemPrompt = (g: Granularity) => `
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
- For a month plan, output exactly 4 blocks: Week 1 … Week 4.
- For a week plan, output exactly 7 blocks: Day 1 … Day 7.
- Never repeat the unit name or the goal inside the tasks.
- End with ONE short prompt only (e.g., "Want me to add this to your calendar?").

NON-PLANNING:
- Tutor Matching: list 2–4 options/criteria with availability, price, short bio.
- Progress Tracking: summarize strengths/weaknesses and 2–3 next steps.

Style: concise, positive, actionable.
`.trim()

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "1",
    type: "assistant",
    content: "Hi Alex! I'm your AI study assistant. How can I help you today?",
    timestamp: new Date(),
    suggestions: ["Make study plan", "Find Algebra tutor", "Schedule 1-hr session"],
  }])
  const [mode, setMode] = useState<Mode>("default")
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [lastPlanText, setLastPlanText] = useState<string | null>(null)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const router = useRouter()

  const isAddIntent = (s: string) =>
    ["add to calendar","add this to calendar","add study plan to calendar"].includes(s.trim().toLowerCase())

  const handoffPlanToSchedule = (plan: string) => {
    const qs = new URLSearchParams({ importPlan: plan }).toString()
    router.push(`/schedule?${qs}`)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return
    const lc = content.toLowerCase()

    if (isAddIntent(lc)) {
      if (lastPlanText) handoffPlanToSchedule(lastPlanText)
      else setMessages(p => [...p, { id: Date.now().toString(), type: "assistant", content: "No plan yet. Try “Make study plan” first, then click Add to calendar.", timestamp: new Date() }])
      return
    }

    if (lc.includes("study plan") || lc.includes("schedule")) setMode("planning")
    else if (lc.includes("tutor")) setMode("tutor")
    else if (lc.includes("practice")) setMode("practice")
    else setMode("default")

    const userMessage: Message = { id: Date.now().toString(), type: "user", content, timestamp: new Date() }
    setMessages(p => [...p, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const granularity = detectGranularity(content)
      const units = requestedUnits(content, granularity)
      const systemMessage = { role: "system", type: "system", content: systemPrompt(granularity) } as any
      const current = [systemMessage, ...messages, userMessage].map((m: any) => ({
        role: m.type === "user" ? "user" : m.type === "assistant" ? "assistant" : "system",
        content: m.content,
      }));

      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: current }),
      });
      const json = await res.json();
      let assistantContent = json?.assistant ?? (json?.raw ? JSON.stringify(json.raw) : "Sorry — no response from the model.")

      const planningish = /(day|week|month)\s*\d+/i.test(assistantContent) ||
                          /(^|\n)\s*-\s*goal\s*:/i.test(assistantContent) ||
                          /(^|\n)\s*tasks?\s*:/i.test(assistantContent)
      if (planningish) {
        assistantContent = normalizePlan(assistantContent, granularity, units)
        setLastPlanText(assistantContent)
      }

      setMessages(p => [...p, {
        id: (Date.now()+1).toString(),
        type: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        mode: planningish ? "planning" : "default",
        suggestions: planningish ? ["Add to calendar", "View diagram"] : undefined,
      }])
    } catch (e) {
      setMessages(p => [...p, { id: (Date.now()+2).toString(), type: "assistant", content: `Error: ${String(e)}`, timestamp: new Date() }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <Card className="h-full flex flex-col rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg"><Bot className="h-5 w-5 text-primary" /></div>
          <span>AI Study Assistant</span>
          <Badge variant="secondary" className="ml-auto">Online</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 p-0 min-h-0">
        <ScrollArea className="flex-1 px-6 min-h-0">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div key={m.id} variants={messageVariants} initial="hidden" animate="visible" exit="exit"
                  className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex space-x-2 max-w-[80%] ${m.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <div className={`p-2 rounded-lg ${m.type === "user" ? "bg-primary/10" : "bg-muted"}`}>
                      {m.type === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className={`p-3 rounded-2xl ${m.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <ReactMarkdown components={{
                        p: (p) => <p className="text-sm leading-relaxed whitespace-pre-wrap" {...p} />,
                        ul: (p) => <ul className="list-disc list-inside text-sm leading-relaxed" {...p} />,
                        li: (p) => <li className="ml-4" {...p} />,
                      }}>
                        {m.content}
                      </ReactMarkdown>

                      {m.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.suggestions.map(s => (
                            <Button key={s} variant="outline" size="sm" className="text-xs h-7 bg-transparent"
                              onClick={() => {
                                const sl = s.toLowerCase()
                                if (sl === "add to calendar" && lastPlanText) { handoffPlanToSchedule(lastPlanText); return }
                                if (sl === "view diagram" && lastPlanText) { setDiagramOpen(true); return }
                                handleSendMessage(s)
                              }}>
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
                  <div className="p-2 rounded-lg bg-muted"><Bot className="h-4 w-4 text-muted-foreground" /></div>
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

        <div className="px-6">
          <div className="flex flex-wrap gap-2">
            {(mode === "planning" ? ["Add to calendar", "View diagram"] : suggestionChips.slice(0, 3).map(c => c.text)).map(text => (
              <motion.div key={text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="text-xs h-8 bg-transparent" onClick={() => handleSendMessage(text)}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  {text}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex space-x-2 items-end">
            <textarea
              placeholder="Ask me anything about your studies..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue) } }}
              rows={1}
              className="flex-1 resize-none max-h-40 overflow-auto rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[3rem] scrollbar-hide"
              onInput={(e) => { const el = e.currentTarget as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px` }}
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
