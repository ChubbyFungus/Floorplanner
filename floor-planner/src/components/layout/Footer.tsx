import React from "react";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#171717",
        color: "#d4af37",
        padding: 2,
        textAlign: "center",
        marginTop: "auto"
      }}
    >
      <Typography variant="body2" sx={{ fontFamily: "serif" }}>
        © {new Date().getFullYear()} Wish Granted Kitchens and Baths. All rights reserved.
      </Typography>
    </Box>
  );
}