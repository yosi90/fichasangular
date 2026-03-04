/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  important: true,
  corePlugins: {
    preflight: false,
  },
  prefix: "tw-",
  theme: {
    extend: {},
  },
  plugins: [],
};
