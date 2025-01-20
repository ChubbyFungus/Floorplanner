import React, { useState, useEffect } from "react";
import { Paper, Box, Typography } from "@mui/material";
import { debugLogger } from "../../utils/debugLogger";

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
    <Paper
      sx={{
        position: "absolute",
        top: 64,
        left: 0,
        width: 250,
        height: "calc(100% - 64px)",
        backgroundColor: "#171717",
        overflowY: "auto",
        borderRight: "1px solid #444",
        padding: 2,
        zIndex: 100,
        color: "#d4af37"
      }}
      elevation={3}
    >
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: "serif" }}>
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
      </Box>
    </Paper>
  );
};

export default AiDesignTipsPanel;