"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles, Calendar, Users, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

const suggestionChips = [
  { text: "Make study plan", icon: Sparkles },
  { text: "Find Algebra tutor", icon: Users },
  { text: "Schedule 1-hr session", icon: Calendar },
  { text: "Review my progress", icon: Clock },
  { text: "Help with homework", icon: Bot },
  { text: "Practice problems", icon: Sparkles },
]

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0],
    } as const,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
}

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
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
    const systemMessage = {
      role: "system",
      type: "system",
      content: `You are a smart, helpful, and encouraging AI study assistant. You support 3 main modes of conversation:

1. Study Planning — Help users create detailed and realistic study schedules based on their subjects and goals.
2. Tutor Matching — Suggest tutors based on subject expertise, availability, and budget.
3. Progress Tracking — Analyze user performance, track learning progress, and suggest areas to improve.

Always ask clarifying questions when needed, and keep responses short, actionable, and encouraging.`,
    };

    const currentMessagesSnapshot = [
      systemMessage,
      ...messages,
      userMessage,
    ].map((m) => ({
      role: m.type === "user" ? "user" : m.type === "assistant" ? "assistant" : "system",
      content: m.content,
    }));

      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessagesSnapshot }),
      });

      const json = await res.json();

      const assistantContent =
        json?.assistant ??
        (json?.raw ? JSON.stringify(json.raw) : "Sorry — no response from the model.");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        suggestions: getRandomSuggestions(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        type: "assistant",
        content: `Error: ${String(err)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const getRandomSuggestions = (): string[] => {
    const shuffled = [...suggestionChips].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3).map((chip) => chip.text)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
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

      <CardContent className="flex-1 flex flex-col space-y-4 p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex space-x-2 max-w-[80%] ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div className={`p-2 rounded-lg ${message.type === "user" ? "bg-primary/10" : "bg-muted"}`}>
                      {message.type === "user" ? (
                        <User className="h-4 w-4 text-primary" />
                      ) : (
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl ${message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside text-sm leading-relaxed" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="ml-4" {...props} />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 bg-transparent"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
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
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Suggestion Chips */}
        <div className="px-6">
          <div className="flex flex-wrap gap-2">
            {suggestionChips.slice(0, 3).map((chip) => {
              const Icon = chip.icon
              return (
                <motion.div key={chip.text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 bg-transparent"
                    onClick={() => handleSuggestionClick(chip.text)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {chip.text}
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 pb-6">
          <div className="flex space-x-2">
            <textarea
              placeholder="Ask me anything about your studies..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              rows={1}
              className="flex-1 resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[3rem]"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";                // reset
                el.style.height = `${el.scrollHeight}px`; // expand to fit
              }}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
