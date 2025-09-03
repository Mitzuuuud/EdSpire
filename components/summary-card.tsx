"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, User, ChevronDown, FileText, CheckCircle, ArrowRight, Download } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

interface SummaryCardProps {
  summary: {
    id: string
    title: string
    tutor: string
    date: string
    duration: string
    subject: string
    tldr: string[]
    actionItems: Array<{
      id: string
      task: string
      completed: boolean
      linkedToPlan: boolean
    }>
    transcript: Array<{
      speaker: string
      timestamp: string
      text: string
    }>
    keyTopics: string[]
    rating?: number
  }
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)

  return (
    <motion.div whileHover={{ scale: 1.005 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{summary.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{summary.tutor}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{summary.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{summary.duration}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{summary.subject}</Badge>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* TL;DR Highlights */}
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <div className="p-1 bg-primary/10 rounded">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span>Key Highlights</span>
            </h4>
            <div className="space-y-2">
              {summary.tldr.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2 p-3 bg-primary/5 rounded-lg"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">{highlight}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <div className="p-1 bg-primary/10 rounded">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <span>Action Items</span>
              <Badge variant="outline" className="text-xs">
                {summary.actionItems.filter((item) => !item.completed).length} pending
              </Badge>
            </h4>
            <div className="space-y-2">
              {summary.actionItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    item.completed ? "bg-green-50 border-green-200" : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        item.completed
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground hover:border-primary"
                      }`}
                    >
                      {item.completed && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.task}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.linkedToPlan && (
                      <Badge variant="outline" className="text-xs">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Study Plan
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Key Topics */}
          <div>
            <h4 className="font-medium mb-3">Topics Covered</h4>
            <div className="flex flex-wrap gap-2">
              {summary.keyTopics.map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          {/* Transcript */}
          <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                <span>View Full Transcript</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isTranscriptOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <ScrollArea className="h-64 w-full border border-border rounded-lg p-4">
                <div className="space-y-3">
                  {summary.transcript.map((entry, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="text-xs text-muted-foreground w-16 flex-shrink-0 mt-1">{entry.timestamp}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">{entry.speaker}</div>
                        <div className="text-sm text-muted-foreground">{entry.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </motion.div>
  )
}
