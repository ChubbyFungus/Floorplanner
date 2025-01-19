// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Home from "./pages/Home";
import { FloorPlanner } from "./pages/FloorPlanner";  // <--- Named import
import ProjectManager from "./pages/ProjectManager";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2"
    },
    secondary: {
      main: "#f50057"
    }
  }
});

let appRenderCount = 0;

function App() {
  useEffect(() => {
    appRenderCount++;
    console.log("=====================================");
    console.log(`[${new Date().toISOString()}] App render #${appRenderCount}`);
    console.log("=====================================");
    return () => {
      console.log(`[${new Date().toISOString()}] App cleanup #${appRenderCount}`);
    };
  });

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/floor-planner" element={<FloorPlanner />} />
          <Route path="/projects" element={<ProjectManager />} />
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;