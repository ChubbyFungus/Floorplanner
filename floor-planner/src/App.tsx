import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Provider } from "react-redux";
import { store } from "./store";
import Home from "./pages/Home";
import { FloorPlanner } from "./pages/FloorPlanner";
import ProjectManager from "./pages/ProjectManager";

// Import them as default exports
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

function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;
