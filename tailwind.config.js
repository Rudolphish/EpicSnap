// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        gray: {
          750: "#2d3748",
          850: "#1a202c",
          950: "#0f172a",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
