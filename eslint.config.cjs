const expo = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  ...expo,
  prettierRecommended,
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "build/",
      "eslint.config.cjs",
      "eslint.config.mjs",
      "tailwind.config.js",
      "babel.config.js"
    ]
  }
];
