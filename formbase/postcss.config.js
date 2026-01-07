/*
  PostCSS config for Tailwind + NativeWind.
  - Adds autoprefixer for cross-platform style support
*/
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('nativewind/postcss'),
  ],
}
