"use client"

import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import { Palette, Square, Circle, Type, Minus, Trash2, Download, Undo, MousePointer } from "lucide-react"

interface DrawingCanvasProps {
  roomId: string
  websocket: WebSocket | null
  initialDrawings: Array<{
    id: number
    message: string
    userId: string
    User: {
      id: string
      name: string
      email: string
    }
  }>
}

type DrawingTool = "select" | "brush" | "rectangle" | "circle" | "text" | "line"
type FabricObjectWithFromRemote = fabric.Object & { fromRemote?: boolean }

export default function DrawingCanvas({ roomId, websocket, initialDrawings }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [activeTool, setActiveTool] = useState<DrawingTool>("brush")
  const [brushColor, setBrushColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const isDrawingRef = useRef(false)

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
  ]

  const loadInitialDrawings = () => {
    if (!fabricCanvasRef.current) return

    console.log("[v0] ===== LOADING INITIAL DRAWINGS =====")
    console.log("[v0] Total initial drawings received:", initialDrawings.length)
    console.log("[v0] Initial drawings data:", initialDrawings)

    if (initialDrawings.length === 0) {
      console.log("[v0] No initial drawings to load")
      return
    }

    initialDrawings.forEach((drawing, index) => {
      try {
        console.log(`[v0] Processing drawing ${index + 1}:`, drawing)

        let drawingData = drawing.message
        console.log("[v0] Raw message data:", drawingData, "Type:", typeof drawingData)

        if (typeof drawingData === "string") {
          try {
            drawingData = JSON.parse(drawingData)
            console.log("[v0] Parsed string message to object:", drawingData)
          } catch (parseError) {
            console.error("[v0] Failed to parse message as JSON:", parseError)
            return
          }
        }

        console.log("[v0] Final drawing data to render:", drawingData)
        handleRemoteDrawing(drawingData)
      } catch (error) {
        console.error("[v0] Error loading drawing:", error, drawing)
      }
    })

    console.log("[v0] ===== FINISHED LOADING INITIAL DRAWINGS =====")
  }

  const handleRemoteDrawing = (drawingData: any) => {
    if (!fabricCanvasRef.current) {
      console.error("[v0] Canvas not available for remote drawing")
      return
    }

    const canvas = fabricCanvasRef.current
    console.log("[v0] Handling remote drawing:", drawingData)

    try {
      switch (drawingData.type) {
        case "path":
          console.log("[v0] Creating path from data:", drawingData.data)
          fabric.Path.fromObject(drawingData.data, (path: FabricObjectWithFromRemote) => {
            path.fromRemote = true
            canvas.add(path)
            canvas.renderAll()
            console.log("[v0] Path added to canvas")
          })
          break
        case "rect":
          console.log("[v0] Creating rectangle from data:", drawingData.data)
          fabric.Rect.fromObject(drawingData.data, (rect: FabricObjectWithFromRemote) => {
            rect.fromRemote = true
            canvas.add(rect)
            canvas.renderAll()
            console.log("[v0] Rectangle added to canvas")
          })
          break
        case "circle":
          console.log("[v0] Creating circle from data:", drawingData.data)
          fabric.Circle.fromObject(drawingData.data, (circle: FabricObjectWithFromRemote) => {
            circle.fromRemote = true
            canvas.add(circle)
            canvas.renderAll()
            console.log("[v0] Circle added to canvas")
          })
          break
        case "text":
          console.log("[v0] Creating text from data:", drawingData.data)
          fabric.Text.fromObject(drawingData.data, (text: FabricObjectWithFromRemote) => {
            text.fromRemote = true
            canvas.add(text)
            canvas.renderAll()
            console.log("[v0] Text added to canvas")
          })
          break
        case "line":
          console.log("[v0] Creating line from data:", drawingData.data)
          fabric.Line.fromObject(drawingData.data, (line: FabricObjectWithFromRemote) => {
            line.fromRemote = true
            canvas.add(line)
            canvas.renderAll()
            console.log("[v0] Line added to canvas")
          })
          break
        default:
          console.warn("[v0] Unknown drawing type:", drawingData.type)
      }
    } catch (error) {
      console.error("[v0] Error handling remote drawing:", error, drawingData)
    }
  }

  const handleDrawingComplete = (e: fabric.IEvent) => {
    if (!websocket || !e.path) return

    const drawingData = {
      type: "path",
      data: e.path.toObject(),
    }

    sendDrawingData(drawingData)
  }

  const handleObjectAdded = (e: fabric.IEvent) => {
    if (!isDrawingRef.current) return

    const obj = e.target
    if (!obj || !websocket) return

    let drawingData: any = null

    if (obj.type === "rect") {
      drawingData = { type: "rect", data: obj.toObject() }
    } else if (obj.type === "circle") {
      drawingData = { type: "circle", data: obj.toObject() }
    } else if (obj.type === "text") {
      drawingData = { type: "text", data: obj.toObject() }
    } else if (obj.type === "line") {
      drawingData = { type: "line", data: obj.toObject() }
    }

    if (drawingData) {
      sendDrawingData(drawingData)
    }

    isDrawingRef.current = false
  }

  const sendDrawingData = (drawingData: any) => {
    if (!websocket) {
      console.error("[v0] WebSocket not available for sending drawing data")
      return
    }

    const message = {
      type: "chat_message",
      data: {
        roomId: roomId,
        message: drawingData, // Send as object, backend will handle JSON serialization
      },
    }

    console.log("[v0] Sending drawing data:", message)

    try {
      websocket.send(JSON.stringify(message))
      console.log("[v0] Drawing data sent successfully")
    } catch (error) {
      console.error("[v0] Failed to send drawing data:", error)
    }
  }

  const handleCanvasClick = (e: fabric.IEvent) => {
    if (!fabricCanvasRef.current || activeTool === "select" || activeTool === "brush") return

    const canvas = fabricCanvasRef.current
    const pointer = canvas.getPointer(e.e)
    isDrawingRef.current = true

    switch (activeTool) {
      case "rectangle":
        const rect = new fabric.Rect({
          left: pointer.x - 50,
          top: pointer.y - 25,
          width: 100,
          height: 50,
          fill: "transparent",
          stroke: brushColor,
          strokeWidth: brushSize,
        })
        canvas.add(rect)
        break

      case "circle":
        const circle = new fabric.Circle({
          left: pointer.x - 25,
          top: pointer.y - 25,
          radius: 25,
          fill: "transparent",
          stroke: brushColor,
          strokeWidth: brushSize,
        })
        canvas.add(circle)
        break

      case "text":
        const text = new fabric.Text("Click to edit", {
          left: pointer.x,
          top: pointer.y,
          fill: brushColor,
          fontSize: brushSize * 4,
        })
        canvas.add(text)
        break

      case "line":
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
          stroke: brushColor,
          strokeWidth: brushSize,
        })
        canvas.add(line)
        break
    }
  }

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.backgroundColor = "white"
      fabricCanvasRef.current.renderAll()
    }
  }

  const downloadCanvas = () => {
    if (!fabricCanvasRef.current) return

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
    })

    const link = document.createElement("a")
    link.download = `drawing-${roomId}-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  const undo = () => {
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects()
      if (objects.length > 0) {
        fabricCanvasRef.current.remove(objects[objects.length - 1])
      }
    }
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 320,
      height: window.innerHeight - 80,
      backgroundColor: "white",
    })

    fabricCanvasRef.current = canvas

    canvas.on("mouse:down", handleCanvasClick)
    canvas.on("path:created", handleDrawingComplete)
    canvas.on("object:added", handleObjectAdded)

    setTimeout(() => {
      console.log("[v0] Canvas initialized, loading initial drawings...")
      loadInitialDrawings()
    }, 500)

    if (websocket) {
      websocket.onmessage = (event) => {
        console.log("[v0] Canvas received WebSocket message:", event.data)
        try {
          const data = JSON.parse(event.data)
          console.log("[v0] Parsed message data:", data)

          if (data.type === "chat_message") {
            let drawingData = data.message
            console.log("[v0] Raw drawing data from WebSocket:", drawingData, "Type:", typeof drawingData)

            if (typeof drawingData === "string") {
              try {
                drawingData = JSON.parse(drawingData)
                console.log("[v0] Parsed WebSocket drawing data:", drawingData)
              } catch (parseError) {
                console.error("[v0] Failed to parse WebSocket drawing data:", parseError)
                return
              }
            }
            console.log("[v0] Processing WebSocket drawing data:", drawingData)
            handleRemoteDrawing(drawingData)
          }
        } catch (error) {
          console.error("[v0] Failed to process WebSocket message:", error)
        }
      }
    }

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 320,
        height: window.innerHeight - 80,
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      canvas.dispose()
    }
  }, [websocket, roomId])

  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    switch (activeTool) {
      case "select":
        canvas.isDrawingMode = false
        canvas.selection = true
        break
      case "brush":
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize
        break
      case "rectangle":
      case "circle":
      case "line":
      case "text":
        canvas.isDrawingMode = false
        canvas.selection = false
        break
    }
  }, [activeTool, brushColor, brushSize])

  return (
    <div className="flex h-full">
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">Drawing Tools</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tools</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTool("select")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  activeTool === "select"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MousePointer className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setActiveTool("brush")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  activeTool === "brush"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Palette className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setActiveTool("rectangle")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  activeTool === "rectangle"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Square className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setActiveTool("circle")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  activeTool === "circle"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Circle className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setActiveTool("line")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  activeTool === "line"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Minus className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setActiveTool("text")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  activeTool === "text"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Type className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Colors</h3>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    brushColor === color ? "border-gray-400 scale-110" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-3">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Brush Size: {brushSize}px</h3>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={undo}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Undo className="w-4 h-4" />
              Undo
            </button>
            <button
              onClick={clearCanvas}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Canvas
            </button>
            <button
              onClick={downloadCanvas}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 p-4">
        <div className="canvas-container bg-white">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
