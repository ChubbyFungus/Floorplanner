import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * A basic Footer component with Material-UI.
 * You can replace this with your own styling or markup.
 */
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1976d2",
        color: "#fff",
        padding: 2,
        textAlign: "center",
        marginTop: "auto"
      }}
    >
      <Typography variant="body2">
        © {new Date().getFullYear()} Floor Planner. All rights reserved.
      </Typography>
    </Box>
  );
}
