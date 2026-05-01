/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kitchen: {
          bg: "#F7F8F5",
          paper: "#FFFFFF",
          ink: "#111827",
          muted: "#6B7280",
          line: "#E5E7EB",
          green: "#2F8F6B",
          blue: "#2F6BFF",
          cream: "#F8F7F2"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};
