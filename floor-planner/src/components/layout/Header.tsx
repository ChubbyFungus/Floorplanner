import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

/**
 * Updated Header:
 * - Navy background
 * - Champagne accent color
 */

export default function Header() {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#0b1c44",
        boxShadow: "0 4px 8px rgba(0,0,0,0.8)",
        borderBottom: "1px solid #2a345a"
      }}
    >
      <Toolbar
        sx={{
          minHeight: 56,
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
              color: "#e5d2b3",
              transition: "transform 0.2s",
              "&:hover": {
                color: "#fff",
                backgroundColor: "transparent",
                transform: "scale(1.05)"
              }
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "serif",
              fontWeight: "bold",
              color: "#e5d2b3",
              fontSize: "1.2rem"
            }}
          >
            Wish Granted Kitchens
          </Typography>
        </Box>

        {/* Right Section / Navigation */}
        <Box display="flex" alignItems="center" gap={3}>
          <Button
            component={Link}
            to="/floor-planner"
            disableRipple
            disableElevation
            variant="text"
            sx={{
              color: "#e5d2b3",
              textTransform: "none",
              fontFamily: "serif",
              fontSize: "0.95rem",
              p: 0,
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
              color: "#e5d2b3",
              textTransform: "none",
              fontFamily: "serif",
              fontSize: "0.95rem",
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
              color: "#e5d2b3",
              textTransform: "none",
              fontFamily: "serif",
              fontSize: "0.95rem",
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