import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { AuthProvider } from "./contexts/AuthContext";
import GlobalStyles from "./styles/GlobalStyles";
import theme from "./styles/Theme"; // Make sure this is correct
import App from "./App"; // ✅ ADD THIS LINE

// Diagnostic Log 2
console.log("--- THEME OBJECT IN INDEX.JS ---", theme);
if (!theme?.typography) {
  console.error("CRITICAL ERROR: The imported theme object is missing the 'typography' key. Check the import path and the Theme.js file.");
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
);
