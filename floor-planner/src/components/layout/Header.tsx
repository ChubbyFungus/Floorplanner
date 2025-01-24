import React from "react";
import { AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/system";

/**
 * Neumorphic container styling for the entire header bar.
 * We replicate the style from the toolbar:
 *   - dark background (#000)
 *   - inset shadows
 *   - slight gradient
 */
const NeumorphicHeaderBar = styled(AppBar)(() => ({
  background: "#000000",
  boxShadow: "inset 8px 8px 16px #0a0a0a, inset -8px -8px 16px #1a1a1a, 0 0 5px rgba(255,255,255,0.2)",
  borderRadius: "0 0 20px 20px",
  position: "relative"
}));

const NeumorphicToolbar = styled(Toolbar)(() => ({
  minHeight: 56,
  display: "flex",
  justifyContent: "space-between",
  padding: "0 16px"
}));

const BrandBox = styled(Box)(() => ({
  display: "flex",
  alignItems: "center"
}));

const BrandText = styled(Typography)(() => ({
  fontFamily: "serif",
  fontWeight: "bold",
  fontSize: "1.2rem",
  color: "#fad6a5",
  marginLeft: "8px"
}));

export default function Header() {
  return (
    <NeumorphicHeaderBar position="static">
      <NeumorphicToolbar>
        {/* Left Section / Brand & Optional Menu */}
        <BrandBox>
          <IconButton
            size="small"
            edge="start"
            aria-label="menu"
            sx={{
              color: "#fad6a5",
              transition: "transform 0.2s",
              "&:hover": {
                color: "#3b82f6",
                backgroundColor: "transparent",
                transform: "scale(1.05)"
              }
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <BrandText>Wish Granted Kitchens</BrandText>
        </BrandBox>

        {/* Right Section / Demo Buttons */}
        <Box display="flex" alignItems="center" gap={3}>
          <Typography
            variant="body2"
            component="a"
            href="#"
            sx={{
              color: "#fad6a5",
              textDecoration: "none",
              fontFamily: "serif",
              transition: "color 0.2s",
              "&:hover": { color: "#3b82f6" }
            }}
          >
            Get Estimate
          </Typography>
          <Typography
            variant="body2"
            component="a"
            href="#"
            sx={{
              color: "#fad6a5",
              textDecoration: "none",
              fontFamily: "serif",
              transition: "color 0.2s",
              "&:hover": { color: "#3b82f6" }
            }}
          >
            About
          </Typography>
          <Typography
            variant="body2"
            component="a"
            href="#"
            sx={{
              color: "#fad6a5",
              textDecoration: "none",
              fontFamily: "serif",
              transition: "color 0.2s",
              "&:hover": { color: "#3b82f6" }
            }}
          >
            Contact
          </Typography>
        </Box>
      </NeumorphicToolbar>
    </NeumorphicHeaderBar>
  );
}