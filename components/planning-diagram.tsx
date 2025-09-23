"use client"

import React, { useRef, useState, useEffect, useLayoutEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface NodeData {
  id: string
  x: number
  y: number
  title: string
  details?: string
}

interface PlanningDiagramProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planText: string
}

function parsePlanToNodes(planText: string): NodeData[] {
  const weekBlocks = [...planText.matchAll(/Week\s*(\d+)[:\-]?([\s\S]*?)(?=Week\s*\d+|$)/gi)]
  const nodes: NodeData[] = []
  if (weekBlocks.length > 0) {
    weekBlocks.forEach((m) => {
      const num = m[1]
      const body = (m[2] || "").trim()
      nodes.push({ id: `week-${num}`, x: 0, y: 0, title: `Week ${num}`, details: body || `Week ${num}` })
    })
  } else {
    const dayBlocks = [...planText.matchAll(/Day\s*(\d+)[:\-]?([\s\S]*?)(?=Day\s*\d+|$)/gi)]
    if (dayBlocks.length) {
      dayBlocks.forEach((m) => {
        const num = m[1]
        const body = (m[2] || "").trim()
        nodes.push({ id: `day-${num}`, x: 0, y: 0, title: `Day ${num}`, details: body || `Day ${num}` })
      })
    } else {
      const paragraphs = planText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 12)
      paragraphs.forEach((p, i) => {
        nodes.push({ id: `p-${i}`, x: 0, y: 0, title: p.split(/\n|\.|:/)[0].slice(0, 40), details: p })
      })
    }
  }
  if (nodes.length === 0) nodes.push({ id: `n-0`, x: 0, y: 0, title: "Study Plan", details: planText })
  return nodes
}

export function PlanningDiagram({ open, onOpenChange, planText }: PlanningDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [nodes, setNodes] = useState<NodeData[]>(() => parsePlanToNodes(planText))
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [scale, setScale] = useState<number>(1)
  const [panning, setPanning] = useState<boolean>(false)
  const panStart = useRef<{ x: number; y: number } | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [mountedCount, setMountedCount] = useState(0)

    // safe layout after paint
  const forceLayout = () => {
    requestAnimationFrame(() => {
        doMasonryLayout()
        // run a second time in case fonts/layout shift after first paint
        requestAnimationFrame(() => doMasonryLayout())
    })
  }
  // Map of node id -> DOM element (to measure heights)
  const nodeEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const setNodeEl = (id: string) => (el: HTMLDivElement | null) => {
    if (!el) nodeEls.current.delete(id)
    else nodeEls.current.set(id, el)
  }

  // Nodes the user has dragged; auto-layout won’t move these
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set())

  // Rebuild nodes when plan changes
  useEffect(() => {
    setNodes(parsePlanToNodes(planText))
    setExpanded(new Set())
    setFixedIds(new Set())
    // center again
    setPan({ x: 0, y: 0 })
    setScale(1)
  }, [planText])

  useEffect(() => {
    setMountedCount(0)
  }, [nodes.length])

  // Global mouse listeners
  useEffect(() => {
    const onUp = () => {
      if (dragging) setFixedIds(prev => new Set(prev).add(dragging))
      setDragging(null)
      setPanning(false)
      panStart.current = null
    }
    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      if (dragging) {
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const innerX = (cx - pan.x) / scale
        const innerY = (cy - pan.y) / scale
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging ? { ...n, x: innerX - offset.x, y: innerY - offset.y } : n
          )
        )
        return
      }
      if (panning && panStart.current) {
        const dx = e.clientX - panStart.current.x
        const dy = e.clientY - panStart.current.y
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
        panStart.current = { x: e.clientX, y: e.clientY }
      }
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging, offset, pan, panning, scale])

  useEffect(() => {
    if (open && mountedCount >= nodes.length && nodes.length > 0) {
      forceLayout()
    }
  }, [open, mountedCount, nodes.length])

  useEffect(() => {
    setNodes(parsePlanToNodes(planText))
    setExpanded(new Set())
    setFixedIds(new Set())
    setPan({ x: 0, y: 0 })
    setScale(1)
  }, [planText])

  useLayoutEffect(() => { if (open) forceLayout() }, [open])
  useLayoutEffect(() => { forceLayout() }, [Array.from(expanded).join("|")])


  const onStartDrag = (e: React.MouseEvent, node: NodeData) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const innerX = (cx - pan.x) / scale
    const innerY = (cy - pan.y) / scale
    setOffset({ x: innerX - node.x, y: innerY - node.y })
    setDragging(node.id)
    e.stopPropagation()
  }

  const onContainerMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return
    setPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ------------------ AUTO-LAYOUT (masonry, no overlap) ------------------
  const CARD_GAP_X = 40          // horizontal gap between cards
  const CARD_GAP_Y = 24          // vertical gap between cards
  const SIDE_PADDING = 60        // left/right padding inside canvas

  const doMasonryLayout = () => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // measure widths/heights (divide by scale to get world units)
    const measurements = nodes.map(n => {
      const el = nodeEls.current.get(n.id)
      const { width, height } = el ? el.getBoundingClientRect() : { width: 288, height: 140 }
      return { id: n.id, width: width / scale, height: height / scale }
    })

    // compute how many columns fit
    const innerWidth = rect.width / scale - SIDE_PADDING * 2
    const cardWidth = Math.max(...measurements.map(m => m.width), 288)
    const colWidth = cardWidth + CARD_GAP_X
    const cols = Math.max(1, Math.floor(innerWidth / colWidth))

    // track column current Y
    const colHeights = new Array(cols).fill(0)
    const colX: number[] = new Array(cols).fill(0).map((_, i) => SIDE_PADDING + i * colWidth)

    const nextPositions: Record<string, { x: number; y: number }> = {}

    // place nodes in read order unless the node is “fixed” by user drag
    nodes.forEach((n, idx) => {
      if (fixedIds.has(n.id)) {
        // keep its position, but still update column heights so later nodes avoid it
        const el = nodeEls.current.get(n.id)
        const h = (el ? el.getBoundingClientRect().height : 140) / scale
        // find the nearest column for bookkeeping (optional heuristic)
        const nearestCol = Math.max(0, Math.min(cols - 1, Math.round((n.x - SIDE_PADDING) / colWidth)))
        colHeights[nearestCol] = Math.max(colHeights[nearestCol], n.y + h + CARD_GAP_Y)
        nextPositions[n.id] = { x: n.x, y: n.y }
        return
      }

      // pick the shortest column
      let c = 0
      for (let i = 1; i < cols; i++) if (colHeights[i] < colHeights[c]) c = i

      const m = measurements[idx]
      const x = colX[c]
      const y = colHeights[c] === 0 ? SIDE_PADDING : colHeights[c]
      colHeights[c] = y + m.height + CARD_GAP_Y

      nextPositions[n.id] = { x, y }
    })

    setNodes(prev => prev.map(n => ({ ...n, ...nextPositions[n.id] })))
  }

  // reflow after first paint, on expand/collapse, on resize, and when plan changes
  useLayoutEffect(() => { doMasonryLayout() }, [open]) // when dialog opens
  useLayoutEffect(() => { doMasonryLayout() }, [nodes.length]) // first render of nodes
  useLayoutEffect(() => { doMasonryLayout() }, [Array.from(expanded).join("|")]) // expansion changes
  useEffect(() => {
    const onResize = () => doMasonryLayout()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ------------------ connections (simple chain) ------------------
  const connections = nodes.map((n, i) => ({ from: n, to: nodes[i + 1] })).filter((c) => c.to)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] h-[80vh] max-w-none sm:max-w-none rounded-md p-2 flex flex-col">
        <div className="flex items-center justify-between px-4 pt-2">
          <DialogTitle className="text-lg">Planning Diagram</DialogTitle>
        </div>

        <div
          ref={containerRef}
          onMouseDown={onContainerMouseDown}
          onWheel={(e) => {
            e.preventDefault()
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return
            const delta = -e.deltaY
            const zoomFactor = delta > 0 ? 1.08 : 0.92
            const newScale = Math.max(0.4, Math.min(2.5, scale * zoomFactor))
            const cx = e.clientX - rect.left
            const cy = e.clientY - rect.top
            const worldX = (cx - pan.x) / scale
            const worldY = (cy - pan.y) / scale
            const newPanX = cx - worldX * newScale
            const newPanY = cy - worldY * newScale
            setScale(newScale)
            setPan({ x: newPanX, y: newPanY })
          }}
          className="relative flex-1 w-full bg-surface rounded-md overflow-hidden"
        >
          {/* edges */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#9ca3af" />
              </marker>
            </defs>
            {connections.map((c) => (
              <g key={`${c.from.id}-${c.to?.id}`}>
                <line
                  x1={(c.from.x + 120) * scale + pan.x}
                  y1={(c.from.y + 28) * scale + pan.y}
                  x2={(c.to!.x) * scale + pan.x}
                  y2={(c.to!.y + 28) * scale + pan.y}
                  stroke="#9ca3af"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                  markerEnd="url(#arrow)"
                />
              </g>
            ))}
          </svg>

          {/* nodes */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}>
            {nodes.map((n) => {
              const isOpen = expanded.has(n.id)
              return (
                <div
                  key={n.id}
                  data-node
                  ref={setNodeEl(n.id)}
                  onMouseDown={(e) => onStartDrag(e, n)}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(n) }}
                  className="absolute bg-card p-3 rounded-lg shadow cursor-grab w-72"
                  style={{ left: n.x, top: n.y }}
                >
                  <div className="flex items-start gap-2">
                    <div className="font-medium text-sm text-primary flex-1 pr-6">{n.title}</div>
                    <button
                      aria-label={isOpen ? "Collapse node" : "Expand node"}
                      aria-expanded={isOpen}
                      className="absolute right-2 top-2 p-1 rounded hover:bg-muted/60 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(n.id); }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className={isOpen ? "mt-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-auto pr-1"
                                          : "mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3"}
                       style={{ userSelect: "text", cursor: "auto" }}
                       onMouseDown={(e) => e.stopPropagation()}>
                    {n.details}
                  </div>

                  <div className="mt-2 text-[10px] text-muted-foreground/80 select-none">
                    Drag to move • {isOpen ? "Click ▲ to collapse" : "Click ▼ to expand"}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-4 px-2 pb-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}>Zoom +</Button>
            <Button size="sm" onClick={() => setScale((s) => Math.max(0.4, s / 1.2))}>Zoom -</Button>
            <Button size="sm" onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); setSelectedNode(null); setFixedIds(new Set()); doMasonryLayout() }}>Reset</Button>
          </div>

          <div className="ml-4">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
