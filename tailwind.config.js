/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./*.html",
    "./*.js"
  ],
  theme: {
    extend: {
      colors: {
        "surface-container-high": "#e8e8e8",
        "primary": "#000000",
        "secondary-container": "#ced4e4",
        "surface-bright": "#f9f9f9",
        "tertiary-fixed": "#c00001",
        "on-secondary": "#ffffff",
        "surface-container-low": "#f3f3f4",
        "inverse-primary": "#c8c6c5",
        "primary-fixed-dim": "#474746",
        "tertiary-container": "#e8110a",
        "inverse-surface": "#2f3131",
        "surface-container-lowest": "#ffffff",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "surface-container": "#eeeeee",
        "tertiary-fixed-dim": "#930000",
        "on-surface-variant": "#474747",
        "secondary-fixed-dim": "#a4abbb",
        "on-secondary-fixed-variant": "#353c48",
        "on-background": "#1a1c1c",
        "background": "#f9f9f9",
        "on-tertiary-container": "#ffffff",
        "on-secondary-fixed": "#151c27",
        "surface-dim": "#dadada",
        "on-error": "#ffffff",
        "inverse-on-surface": "#f0f1f1",
        "secondary-fixed": "#c0c7d6",
        "primary-fixed": "#5f5e5e",
        "on-error-container": "#410002",
        "surface-variant": "#e2e2e2",
        "on-tertiary-fixed": "#ffffff",
        "on-primary-fixed": "#ffffff",
        "on-primary": "#e5e2e1",
        "on-tertiary-fixed-variant": "#ffdad4",
        "on-surface": "#1a1c1c",
        "outline-variant": "#c6c6c6",
        "surface-tint": "#5f5e5e",
        "surface-container-highest": "#e2e2e2",
        "primary-container": "#3c3b3b",
        "on-primary-fixed-variant": "#e5e2e1",
        "secondary": "#585f6c",
        "outline": "#777777",
        "on-secondary-container": "#151c27",
        "tertiary": "#7e0000",
        "on-primary-container": "#ffffff",
        "surface": "#f9f9f9",
        "on-tertiary": "#ffdad4"
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Manrope", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
}
