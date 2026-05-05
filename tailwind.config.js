/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f8f5ef",
        ink: "#171916",
        moss: "#2f6f4e",
        sage: "#dfe8dc",
        oat: "#ede5d8",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 25, 22, 0.08)",
      },
    },
  },
  plugins: [],
};
