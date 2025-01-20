import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

/**
 * Minimal, sleek Header:
 * - Smaller toolbar height
 * - Text buttons with minimal padding
 * - Subtle highlight on hover (transparent background)
 * - Thinner font sizes for a "less bulky" feel
 */

export default function Header() {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: "1px solid #333"
      }}
    >
      <Toolbar
        sx={{
          minHeight: 48, // reduced height
          display: "flex",
          justifyContent: "space-between",
          px: 2
        }}
      >
        {/* Left Section / Brand & Optional Menu */}
        <Box display="flex" alignItems="center">
          <IconButton
            size="small"
            edge="start"
            aria-label="menu"
            sx={{
              mr: 1,
              color: "#d4af37",
              "&:hover": { backgroundColor: "transparent" }
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "serif",
              fontWeight: "bold",
              color: "#d4af37",
              fontSize: "1.1rem" // smaller text
            }}
          >
            Wish Granted Kitchens
          </Typography>
        </Box>

        {/* Right Section / Navigation */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            component={Link}
            to="/floor-planner"
            disableRipple
            disableElevation
            variant="text"
            sx={{
              color: "#d4af37",
              textTransform: "none",
              fontFamily: "serif",
              fontSize: "0.9rem",
              p: 0, // remove default padding
              "&:hover": {
                backgroundColor: "transparent",
                color: "#fff"
              }
            }}
          >
            Get Estimate
          </Button>
          <Button
            component={Link}
            to="#"
            disableRipple
            disableElevation
            variant="text"
            sx={{
              color: "#d4af37",
              textTransform: "none",
              fontFamily: "serif",
              fontSize: "0.9rem",
              p: 0,
              "&:hover": {
                backgroundColor: "transparent",
                color: "#fff"
              }
            }}
          >
            About
          </Button>
          <Button
            component={Link}
            to="#"
            disableRipple
            disableElevation
            variant="text"
            sx={{
              color: "#d4af37",
              textTransform: "none",
              fontFamily: "serif",
              fontSize: "0.9rem",
              p: 0,
              "&:hover": {
                backgroundColor: "transparent",
                color: "#fff"
              }
            }}
          >
            Contact
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}