import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Updated Footer:
 * - Navy background (#0b1c44)
 * - Champagne text (#e5d2b3)
 */

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#0b1c44",
        color: "#e5d2b3",
        padding: 2,
        textAlign: "center",
        marginTop: "auto",
        boxShadow: "0 -2px 6px rgba(0,0,0,0.7)"
      }}
    >
      <Typography variant="body2" sx={{ fontFamily: "serif", opacity: 0.9 }}>
        © {new Date().getFullYear()} Wish Granted Kitchens and Baths. All rights reserved.
      </Typography>
    </Box>
  );
}