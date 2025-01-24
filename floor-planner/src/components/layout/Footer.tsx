import React from "react";
import { Box, Typography, styled } from "@mui/material";

/**
 * Replaces the prior navy background with a neumorphic black background and shadows.
 */
const NeumorphicFooter = styled(Box)(() => ({
  position: "relative",
  background: "#000000",
  boxShadow: "inset 8px 8px 16px #0a0a0a, inset -8px -8px 16px #1a1a1a, 0 0 5px rgba(255,255,255,0.2)",
  borderRadius: "20px 20px 0 0",
  padding: "16px",
  textAlign: "center"
}));

export default function Footer() {
  return (
    <NeumorphicFooter component="footer">
      <Typography
        variant="body2"
        sx={{
          fontFamily: "serif",
          color: "#fad6a5",
          opacity: 0.9,
          fontSize: "0.9rem"
        }}
      >
        © {new Date().getFullYear()} Wish Granted Kitchens and Baths. All rights reserved.
      </Typography>
    </NeumorphicFooter>
  );
}