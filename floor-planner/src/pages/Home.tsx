
import React from "react";
import { Box, Container, Typography } from "@mui/material";

function Home() {
  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Welcome to the Advanced Floor Planner
        </Typography>
        <Typography variant="body1">
          This platform now includes a dedicated Room tool, letting you click and
          drag to create a rectangular room in one go, plus advanced wall drawing,
          fixture placement, and 3D material mapping.
        </Typography>
        <Typography variant="body1" mt={2}>
          Get started by exploring the Floor Planner or checking existing
          projects in the Project Manager.
        </Typography>
      </Box>
    </Container>
  );
}

export default Home;
