import React, { useState, useEffect } from "react";
import { Box, Typography, styled } from "@mui/material";
import { debugLogger } from "../../utils/debugLogger";

/**
 * Neumorphic outer container for the AI design tips panel.
 */
const NeumorphicAIPanel = styled(Box)(() => ({
  position: "absolute",
  top: 64,
  left: 0,
  width: 250,
  height: "calc(100% - 64px)",
  background: "#000000",
  boxShadow: "inset 8px 8px 16px #0a0a0a, inset -8px -8px 16px #1a1a1a, 0 0 5px rgba(255,255,255,0.2)",
  overflowY: "auto",
  borderRadius: "0 20px 20px 0",
  padding: 16,
  zIndex: 100,
  color: "#fad6a5"
}));

const AiDesignTipsPanel: React.FC = () => {
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    debugLogger("AI Tips fetching...");
    setTimeout(() => {
      setTips([
        "Consider adding more clearance around the island.",
        "Try using lighter finishes to maximize sense of space.",
        "Check fridge door swing for conflicts with cabinetry."
      ]);
    }, 1000);
  }, []);

  return (
    <NeumorphicAIPanel>
      <Typography variant="h6" gutterBottom sx={{ fontFamily: "serif", color: "#fad6a5" }}>
        AI Design Tips
      </Typography>
      {tips.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#fff" }}>
          Gathering suggestions...
        </Typography>
      ) : (
        tips.map((tip, i) => (
          <Box key={i} mb={2}>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              {tip}
            </Typography>
          </Box>
        ))
      )}
    </NeumorphicAIPanel>
  );
};

export default AiDesignTipsPanel;