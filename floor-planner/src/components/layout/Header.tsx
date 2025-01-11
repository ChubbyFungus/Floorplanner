import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * A basic Header component with Material-UI.
 * You can replace this with your own styling or markup.
 */
export default function Header() {
  return (
    <AppBar position="static" sx={{ marginBottom: 2 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Floor Planner
        </Typography>
        <Box display="flex" gap={2}>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/floor-planner">
            Floor Planner
          </Button>
          <Button color="inherit" component={Link} to="/projects">
            Projects
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
