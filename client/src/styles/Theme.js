const theme = {
  palette: {
    primary: {
      main: "#1b4332", // Dark forest green
      light: "#2d5a47",
      dark: "#0f2419",
    },
    secondary: {
      main: "#2d5016", // Dark olive green
      light: "#52734d",
      dark: "#1a2f0d",
    },
    background: {
      main: "#2d3748", // Dark teal from image
      light: "#4a5568",
      dark: "#1a202c",
    },
    surface: {
      main: "#ffffff",
      light: "#f7fafc",
      dark: "#edf2f7",
    },
  },
  colors: {
    primary: "#1b4332", // Dark forest green
    secondary: "#2d5016", // Dark olive green
    accent: "#40916c", // Medium green for highlights
    background: "#2d3748", // Dark teal
    surface: "#ffffff",
    surfaceLight: "#f7fafc",
    surfaceDark: "#edf2f7",
    text: "#2d3748",
    textLight: "#4a5568",
    textSecondary: "#718096",
    textOnDark: "#ffffff",
    textOnDarkSecondary: "#cbd5e0",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    success: "#2d5016",
    warning: "#ed8936",
    error: "#c53030",
    info: "#1b4332",
  },
  gradients: {
    primary: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
    secondary: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
    background: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
    surface: "linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)",
    card: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    button: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
    buttonSecondary: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
    accent: "linear-gradient(135deg, #40916c 0%, #2d5016 100%)",
    success: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
    warning: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
    error: "linear-gradient(135deg, #c53030 0%, #9c2626 100%)",
    info: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
    hero: "linear-gradient(135deg, #0f2419 0%, #1b4332 50%, #2d5016 100%)",
    cardHover: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
    "4xl": "6rem",
    "5xl": "8rem",
  },
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    base: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(27, 67, 50, 0.05)",
    base: "0 1px 3px 0 rgba(27, 67, 50, 0.1), 0 1px 2px 0 rgba(27, 67, 50, 0.06)",
    md: "0 4px 6px -1px rgba(27, 67, 50, 0.1), 0 2px 4px -1px rgba(27, 67, 50, 0.06)",
    lg: "0 10px 15px -3px rgba(27, 67, 50, 0.1), 0 4px 6px -2px rgba(27, 67, 50, 0.05)",
    xl: "0 20px 25px -5px rgba(27, 67, 50, 0.1), 0 10px 10px -5px rgba(27, 67, 50, 0.04)",
    "2xl": "0 25px 50px -12px rgba(27, 67, 50, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(27, 67, 50, 0.06)",
    none: "none",
    glow: "0 0 20px rgba(64, 145, 108, 0.3)",
    glowLarge: "0 0 40px rgba(64, 145, 108, 0.2)",
  },
 // ... (all your other theme properties like shadows)

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // --- ADD THIS NEW BLOCK HERE ---
  animation: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
    easing: {
      default: "ease-in-out",
      in: "ease-in",
      out: "ease-out",
    },
  },
} // This is the closing brace for the 'theme' object

console.log("--- UPDATED DARK GREEN THEME FILE IS RUNNING ---")
export default theme