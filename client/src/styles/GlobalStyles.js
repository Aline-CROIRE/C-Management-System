import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${(props) => props.theme.typography?.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"};
    font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
    line-height: ${(props) => props.theme.typography?.lineHeight?.normal || "1.5"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  }

  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.gradients?.secondary || "linear-gradient(135deg, #6b8e23 0%, #8fbc8f 100%)"};
    border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.colors?.secondary || "#6b8e23"};
  }

  /* Selection Styling */
  ::selection {
    background: ${(props) => props.theme.colors?.secondary || "#6b8e23"}40;
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }

  /* Focus Outline */
  *:focus {
    outline: 2px solid ${(props) => props.theme.colors?.primary || "#667eea"};
    outline-offset: 2px;
  }

  /* Link Styling */
  a {
    color: ${(props) => props.theme.colors?.primary || "#667eea"};
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: ${(props) => props.theme.palette?.primary?.dark || "#4c63d2"};
    }
  }

  /* List Styling */
  ul, ol {
    list-style: none;
  }

  /* Button Reset */
  button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  /* Input Reset */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Image Styling */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Utility Classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 ${(props) => props.theme.spacing?.md || "1rem"};

    @media (min-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
      padding: 0 ${(props) => props.theme.spacing?.lg || "1.5rem"};
    }

    @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
      padding: 0 ${(props) => props.theme.spacing?.xl || "2rem"};
    }
  }

  /* Animation Classes */
  .fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }

  .slide-up {
    animation: slideUp 0.5s ease-out;
  }

  .scale-in {
    animation: scaleIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Responsive Typography */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
    line-height: ${(props) => props.theme.typography?.lineHeight?.tight || "1.25"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  }

  h1 {
    font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
    
    @media (min-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
      font-size: ${(props) => props.theme.typography?.fontSize?.["4xl"] || "2.25rem"};
    }
  }

  h2 {
    font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
    
    @media (min-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
      font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
    }
  }

  h3 {
    font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
    
    @media (min-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
      font-size: ${(props) => props.theme.typography?.fontSize?.["2xl"] || "1.5rem"};
    }
  }

  h4 {
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    
    @media (min-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
      font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
    }
  }

  h5 {
    font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
    
    @media (min-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
      font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    }
  }

  h6 {
    font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
    
    @media (min-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
      font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
    }
  }

  p {
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
    line-height: ${(props) => props.theme.typography?.lineHeight?.relaxed || "1.625"};
  }
`

export default GlobalStyle
