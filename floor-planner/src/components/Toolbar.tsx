"use client";

import { MousePointer2, Grid, Square, Leaf, Type, Circle, Plus, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
  className?: string;
}

export function Toolbar({ onToolSelect, className }: ToolbarProps) {
  const [activeTool, setActiveTool] = useState("pointer");
  const [pressedTool, setPressedTool] = useState<string | null>(null);

  const tools = [
    { id: "pointer", icon: MousePointer2, color: "from-blue-500 to-blue-600", glow: "blue" },
    { id: "grid", icon: Grid, glow: "neutral" },
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
        // Force a fixed vertical toolbar on the left side:
        "fixed top-0 left-0 h-screen w-[72px] z-50 flex flex-col items-center gap-3 p-3",
        // Dark background & styling
        "bg-black shadow-[0_0_25px_rgba(0,0,0,0.8)]",
        "before:absolute before:inset-[2px] before:rounded-[18px]",
        "before:bg-gradient-to-b before:from-neutral-700 before:to-neutral-800",
        "before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
        "relative",
        className
      )}
    >
      {/* A container to ensure the group of buttons is above pseudo-elements */}
      <div className="relative z-10 flex flex-col items-center w-full space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            onMouseDown={() => setPressedTool(tool.id)}
            onMouseUp={() => setPressedTool(null)}
            onMouseLeave={() => setPressedTool(null)}
            className={cn(
              "group relative flex items-center justify-center w-11 h-11 rounded-[10px] transition-all duration-100",
              // Outer 3D container
              "bg-gradient-to-b from-neutral-800 to-neutral-900",
              "shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]",
              "border border-neutral-900/80 p-[4px]"
            )}
          >
            <div
              className={cn(
                "relative flex items-center justify-center w-full h-full rounded-[5px]",
                "bg-gradient-to-b from-neutral-950 to-neutral-900",
                "shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]",
                "before:absolute before:inset-0 before:rounded-[5px]",
                "before:shadow-[inset_0_-3px_4px_rgba(0,0,0,0.7)]",
                {
                  "bg-gradient-to-b from-blue-700 to-blue-800": activeTool === tool.id && tool.glow === "blue",
                  "bg-gradient-to-b from-orange-700 to-orange-800": activeTool === tool.id && tool.glow === "orange",
                }
              )}
              style={{
                boxShadow: `0 0 5px 1px ${
                  activeTool === tool.id ? "rgba(59,130,246,0.6)" : "rgba(250,214,165,0.3)"
                }`,
              }}
            >
              {/* Hover glow */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[5px] opacity-0 transition-all duration-200",
                  "group-hover:opacity-100"
                )}
                style={{
                  boxShadow: `inset 0 0 10px 2px ${
                    activeTool === tool.id ? "rgba(59,130,246,0.4)" : "rgba(250,214,165,0.2)"
                  }`,
                  background: `radial-gradient(circle, ${
                    activeTool === tool.id ? "rgba(59,130,246,0.2)" : "rgba(250,214,165,0.1)"
                  } 0%, transparent 70%)`,
                }}
              />
              {/* Top highlight */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10 rounded-t-[5px]" />
              <tool.icon
                className={cn(
                  "relative w-5 h-5 transition-all duration-200",
                  activeTool === tool.id ? "text-blue-400" : "text-[#fad6a5]",
                  "group-hover:text-blue-400",
                  pressedTool === tool.id && "scale-90"
                )}
                style={{
                  filter: `drop-shadow(0 0 2px ${
                    activeTool === tool.id ? "rgba(59,130,246,0.8)" : "rgba(250,214,165,0.5)"
                  })`,
                }}
              />
              {tool.hasIndicator && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}