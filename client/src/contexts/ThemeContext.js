"use client"

import { createContext, useContext, useState, useEffect } from "react"
import theme from "../styles/Theme"

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: "#1a202c",
    surface: "#2d3748",
    surfaceLight: "#4a5568",
    text: "#ffffff",
    textLight: "#e2e8f0",
    textSecondary: "#a0aec0",
    border: "#4a5568",
    borderLight: "#2d3748",
  },
  gradients: {
    ...theme.gradients,
    background: "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
    surface: "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)",
    card: "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)",
  },
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(theme)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      setCurrentTheme(darkTheme)
    } else {
      setIsDarkMode(false)
      setCurrentTheme(theme)
    }
  }, [])

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode
    setIsDarkMode(newIsDarkMode)

    if (newIsDarkMode) {
      setCurrentTheme(darkTheme)
      localStorage.setItem("theme", "dark")
    } else {
      setCurrentTheme(theme)
      localStorage.setItem("theme", "light")
    }
  }

  const value = {
    currentTheme,
    isDarkMode,
    toggleTheme,
    lightTheme: theme,
    darkTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
