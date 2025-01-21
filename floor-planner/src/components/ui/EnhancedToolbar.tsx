"use client";

import React, { useState } from "react";
import {
  MousePointer2,
  Grid as LucideGrid,
  Square,
  Leaf,
  Type,
  Circle,
  Plus,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils"; // Or remove if not using your own utility function.
import "./EnhancedToolbar.css"; // Ensure this file now exists.

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
  className?: string;
}

export function EnhancedToolbar({ onToolSelect, className }: ToolbarProps) {
  const [activeTool, setActiveTool] = useState("pointer");
  const [pressedTool, setPressedTool] = useState<string | null>(null);

  const tools = [
    { id: "pointer", icon: MousePointer2, color: "from-blue-500 to-blue-600", glow: "blue" },
    { id: "grid", icon: LucideGrid, glow: "neutral" },
    { id: "square", icon: Square, glow: "neutral" },
    { id: "brush", icon: Leaf, glow: "neutral" },
    { id: "text", icon: Type, glow: "neutral" },
    { id: "circle", icon: Circle, glow: "neutral" },
    { id: "add", icon: Plus, color: "from-orange-500 to-orange-600", glow: "orange" },
    { id: "code", icon: Code, hasIndicator: true, glow: "neutral" },
  ];

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    onToolSelect?.(toolId);
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 p-3 rounded-[20px]",
        // Enhanced container effect with deep black background
        "bg-black",
        "shadow-[0_0_25px_rgba(0,0,0,0.8)]",
        "before:absolute before:inset-[2px] before:rounded-[18px]",
        "before:bg-gradient-to-b before:from-neutral-800 before:to-neutral-900",
        "before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
        className
      )}
    >
      <div className="relative z-10 flex items-center gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            onMouseDown={() => setPressedTool(tool.id)}
            onMouseUp={() => setPressedTool(null)}
            onMouseLeave={() => setPressedTool(null)}
            className={cn(
              "group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-100",
              // Metallic button effect
              "border border-neutral-900/80",
              "before:absolute before:inset-0 before:rounded-xl",
              "before:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]",
              "after:absolute after:inset-0 after:rounded-xl",
              "after:shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
              pressedTool === tool.id && "scale-95 transition-transform",
              {
                "bg-gradient-to-b shadow-[0_0_20px_rgba(59,130,246,0.5)]": activeTool === tool.id && tool.glow === "blue",
                "bg-gradient-to-b shadow-[0_0_20px_rgba(249,115,22,0.5)]": activeTool === tool.id && tool.glow === "orange",
                [tool.color || ""]: activeTool === tool.id,
                "bg-gradient-to-b from-neutral-600 to-neutral-700": activeTool !== tool.id
              }
            )}
          >
            {/* LED Glow Effect */}
            <div
              className={cn(
                "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200",
                "group-hover:opacity-100",
                {
                  "bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.6)]": tool.glow === "blue",
                  "bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.6)]": tool.glow === "orange",
                  "bg-neutral-400/20 shadow-[0_0_15px_rgba(200,200,200,0.4)]": tool.glow === "neutral"
                }
              )}
            />
            <tool.icon
              className={cn(
                "relative w-5 h-5 transition-colors duration-200",
                activeTool === tool.id ? "text-white" : "text-neutral-300",
                "group-hover:text-white",
                pressedTool === tool.id && "scale-90 transition-transform"
              )}
            />
            {tool.hasIndicator && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}