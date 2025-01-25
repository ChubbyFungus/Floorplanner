"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSnapToWalls,
  toggleSnapToFixtures,
  toggleGrid,
  UiState
} from "../../store/slices/uiSlice";
import type { FixtureData, WallData, RoomData } from "@/types/types";
import { styled } from "@mui/system";
import { Box, IconButton, Tooltip } from "@mui/material";

// ========================================================
// ICONS
// ========================================================

// Pointer finger (selection)
const PointerFingerIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    <path d="M256 0C153.755 0 76 77.755 76 180c0 104.86 166.164 318.475 172.99 327.438a20 20 0 0 0 32.02 0C269.836 498.475 436 284.86 436 180 436 77.755 358.245 0 256 0zm0 70c25.405 0 46 20.596 46 46v46h46c25.405 0 46 20.596 46 46 0 5.522-4.477 10-10 10h-20v90c0 5.522-4.477 10-10 10h-20v30c0 5.522-4.477 10-10 10h-20v20c0 5.522-4.477 10-10 10h-20c-5.523 0-10-4.478-10-10v-100c0-5.522-4.477-10-10-10h-30c-5.523 0-10-4.478-10-10V106c0-25.404 20.595-46 46-46z"/>
  </svg>
);

// Straight line for Draw Wall
const WallIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 12h18M3 12l2 2M3 12l2-2" />
  </svg>
);

// Rectangle for Draw Room
const RoomIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

// Door icon
const DoorIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 3h16v18H4z" />
    <path d="M14 3v18" />
    <circle cx="9" cy="12" r="1" />
  </svg>
);

// Window icon
const WindowIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M3 12h18M12 3v18" />
  </svg>
);

// Undo icon
const UndoIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 10h10a7 7 0 017 7v0a7 7 0 01-7 7H3M3 10l4-4M3 10l4 4" />
  </svg>
);

// Redo icon
const RedoIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10H11a7 7 0 00-7 7v0a7 7 0 007 7h10M21 10l-4-4M21 10l-4 4" />
  </svg>
);

// Eye-like toggle for "Show Grid"
const ShowGridIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3h18v18H3V3zM9 3v18M15 3v18M3 9h18M3 15h18" />
</svg>
);

// Wall snapping icon
const WallSnapIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 6h16M4 12h16M4 18h16M6 6v12M18 6v12"/>
  </svg>
);

// Fixture snapping icon
const FixtureSnapIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 2v20M22 12H2M6 6l12 12M18 6L6 18M19 5l1-1M5 19l-1-1M19 19l1-1M5 5l-1-1"/>
  </svg>
);

// ========================================================
// STYLED COMPONENTS
// ========================================================
const OuterWrapper = styled(Box)(() => ({
  position: "relative",
  padding: "18px"
}));

const GlowContainer = styled(Box)(() => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "calc(100% - 16px)",
  height: "calc(100% - 16px)",
  borderRadius: "38px",
  background: "linear-gradient(180deg, rgba(30,48,88,0.4) 0%, rgba(15,28,51,0.4) 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-8px",
    left: "-8px",
    right: "-8px",
    bottom: "-8px",
    borderRadius: "44px",
    background: "radial-gradient(circle at center, rgba(59,130,246,0.4), transparent 70%)",
    filter: "blur(20px)"
  },
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "38px",
    boxShadow: "0 0 35px 6px rgba(59,130,246,0.4)"
  },
  zIndex: 0
}));

const InnerContainer = styled(Box)(() => ({
  position: "relative",
  zIndex: 1
}));

const ToolbarContainer = styled(Box)(() => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "6px",
  margin: "3px",
  borderRadius: "20px",
  background: "#000000",
  boxShadow:
    "inset 8px 8px 16px #0a0a0a, inset -8px -8px 16px #1a1a1a, 0 0 8px rgba(59,130,246,0.7)"
}));

const ButtonContainer = styled(Box)(() => ({
  position: "relative",
  width: "44px",
  height: "44px"
}));

const StyledIconButton = styled(IconButton)(() => ({
  width: "44px",
  height: "44px",
  borderRadius: "10px",
  padding: "2px",
  background: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
  boxShadow: "3px 3px 6px #0a0a0a, -3px -3px 6px #2a2a2a",
  border: "1px solid rgba(0,0,0,0.8)",
  position: "relative",
  zIndex: 2,
  transition: "transform 0.15s, box-shadow 0.15s",
  "&:hover": {
    transform: "scale(1.1)",
    boxShadow: "0 0 12px 3px rgba(59,130,246,0.8)"
  }
}));

const IconWrapper = styled(Box)<{ active: string }>(({ active }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  borderRadius: "8px",
  background: "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
  boxShadow: "inset 2px 2px 4px #000000, inset -2px -2px 4px #2a2a2a",
  transition: "all 0.2s",
  color: active === "true" ? "#3b82f6" : "#fad6a5",
  filter: `drop-shadow(0 0 2px ${
    active === "true" ? "rgba(59,130,246,0.8)" : "rgba(250,214,165,0.6)"
  })`
}));

type Tool =
  | "select"
  | "wall"
  | "room"
  | "door"
  | "window"
  | "undo"
  | "redo"
  | "showGrid";

interface ToolbarItem {
  id: Tool;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

interface MuiToolbarProps {
  onToolSelect?: (toolId: Tool) => void;
}

export function MuiToolbar({ onToolSelect }: MuiToolbarProps) {
  const dispatch = useDispatch();
  const ui = useSelector((state: { ui: UiState }) => state.ui);
  const { snapToWalls, snapToFixtures, showGrid } = ui;

  const [activeTool, setActiveTool] = useState<Tool>("select");

  // Tools in the main list
  const tools: ToolbarItem[] = [
    { id: "select", label: "Selection Tool", icon: PointerFingerIcon },
    { id: "wall", label: "Draw Wall", icon: WallIcon },
    { id: "room", label: "Draw Room", icon: RoomIcon },
    { id: "door", label: "Insert Door", icon: DoorIcon },
    { id: "window", label: "Insert Window", icon: WindowIcon },
    { id: "undo", label: "Undo", icon: UndoIcon },
    { id: "redo", label: "Redo", icon: RedoIcon },
    { id: "showGrid", label: "Show/Hide Grid", icon: ShowGridIcon }
  ];

  const handleToolClick = (toolId: Tool) => {
    setActiveTool(toolId);
    if (onToolSelect) {
      onToolSelect(toolId);
    }
    // If it's specifically "showGrid", just dispatch toggling the grid
    if (toolId === "showGrid") {
      dispatch(toggleGrid());
    }
  };

  return (
    <OuterWrapper>
      <GlowContainer />
      <InnerContainer>
        <ToolbarContainer>
          {tools.map((tool) => (
            <ButtonContainer key={tool.id}>
              <Tooltip title={tool.label} arrow placement="right">
                <StyledIconButton onClick={() => handleToolClick(tool.id)}>
                  <IconWrapper active={(activeTool === tool.id).toString()}>
                    <tool.icon size={20} />
                  </IconWrapper>
                </StyledIconButton>
              </Tooltip>
            </ButtonContainer>
          ))}

          {/* Additional snap toggles at the bottom */}
          <ButtonContainer>
            <Tooltip title="Toggle Wall Snapping" arrow placement="right">
              <StyledIconButton onClick={() => dispatch(toggleSnapToWalls())}>
                <IconWrapper active={snapToWalls.toString()}>
                  <WallSnapIcon size={20} />
                </IconWrapper>
              </StyledIconButton>
            </Tooltip>
          </ButtonContainer>

          <ButtonContainer>
            <Tooltip title="Toggle Fixture Snapping" arrow placement="right">
              <StyledIconButton onClick={() => dispatch(toggleSnapToFixtures())}>
                <IconWrapper active={snapToFixtures.toString()}>
                  <FixtureSnapIcon size={20} />
                </IconWrapper>
              </StyledIconButton>
            </Tooltip>
          </ButtonContainer>
        </ToolbarContainer>
      </InnerContainer>
    </OuterWrapper>
  );
}