import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { FloorPlanner } from "./pages/FloorPlanner";
import ProjectManager from "./pages/ProjectManager";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#d4af37" // gold accent
    },
    secondary: {
      main: "#FFFFFF"
    },
    background: {
      default: "#0B0B0B",
      paper: "#171717"
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#d4af37"
    }
  },
  typography: {
    fontFamily: "serif"
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
          <Route path="/" element={<FloorPlanner />} />
          <Route path="/projects" element={<ProjectManager />} />
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;