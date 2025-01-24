"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleSnapToWalls, toggleSnapToFixtures, UiState } from "../../store/slices/uiSlice";
import type { WallData, RoomData } from "@/types/types";
import { styled } from "@mui/system";
import { Box, IconButton, Tooltip } from "@mui/material";
// SVG icon components
const SelectionIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M4 4l7.07 17.97 2.51-7.39 7.39-2.51L4 4zM13.5 13.5l4 4"/>
  </svg>
);

const WallIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M3 3h18v18H3V3zM3 9h18M3 15h18M9 3v18M15 3v18"/>
  </svg>
);

const RoomIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M22 12H2M12 2v20M4 6.5h3M17 6.5h3M4 17.5h3M17 17.5h3M7.5 4v3M7.5 17v3M16.5 4v3M16.5 17v3"/>
  </svg>
);

const UndoIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M3 10h10a7 7 0 017 7v0a7 7 0 01-7 7H3M3 10l4-4M3 10l4 4"/>
  </svg>
);

const RedoIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M21 10H11a7 7 0 00-7 7v0a7 7 0 007 7h10M21 10l-4-4M21 10l-4 4"/>
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

const RulerIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M16 2l6 6-14 14-6-6L16 2zM7.5 8.5l2 2M10.5 5.5l2 2M4.5 11.5l2 2M7.5 14.5l2 2"/>
  </svg>
);

/**
 * We define a TypeScript interface so that we can pass onToolSelect without triggering
 * the 'IntrinsicAttributes' error. 
 */
interface MuiToolbarProps {
  onToolSelect?: (toolId: "select" | "wall" | "room" | "undo" | "redo" | "showMeasurements") => void;
  showMeasurements?: boolean;
  angleSnapEnabled?: boolean;
  showGrid?: boolean;
}

/**
 * Styled components for the toolbar with stronger glow.
 */
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
    "inset 8px 8px 16px #0a0a0a, inset -8px -8px 16px #1a1a1a, 0 0 6px rgba(255,255,255,0.3)"
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
    transform: "scale(1.07)",
    boxShadow: "0 0 12px 3px rgba(59,130,246,0.7)"
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

// Type definition for toolbar items
type Tool = {
  id: "select" | "wall" | "room" | "undo" | "redo" | "showMeasurements";
  label: string;
  icon: React.ComponentType<{ size: number }>;
};

export function MuiToolbar({ onToolSelect }: MuiToolbarProps) {
  const dispatch = useDispatch();
  const { snapToWalls, snapToFixtures } = useSelector((state: { ui: UiState }) => state.ui);
  const [activeTool, setActiveTool] = useState<Tool['id'] | 'showMeasurements'>("select");

  const tools: Tool[] = [
    { id: "select", label: "Selection Tool", icon: SelectionIcon },
    { id: "wall", label: "Draw Wall", icon: WallIcon },
    { id: "room", label: "Draw Room", icon: RoomIcon },
    { id: "undo", label: "Undo", icon: UndoIcon },
    { id: "redo", label: "Redo", icon: RedoIcon }
  ];

  const measurementToggle: Tool = {
    id: "showMeasurements",
    label: "Show Measurements",
    icon: RulerIcon
  };

  const handleToolClick = (toolId: Tool['id'] | 'showMeasurements') => {
    setActiveTool(toolId);
    if (onToolSelect) {
      onToolSelect(toolId);
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

          <ButtonContainer key={measurementToggle.id}>
            <Tooltip title={measurementToggle.label} arrow placement="right">
              <StyledIconButton onClick={() => handleToolClick('showMeasurements')}>
                <IconWrapper active={(activeTool === measurementToggle.id).toString()}>
                  <measurementToggle.icon size={20} />
                </IconWrapper>
              </StyledIconButton>
            </Tooltip>
          </ButtonContainer>

          {/* Snapping Controls */}
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
