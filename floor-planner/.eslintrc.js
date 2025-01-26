module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    env: {
      browser: true,
      es2021: true,
      jest: true
    },
    plugins: ["react", "@typescript-eslint", "react-hooks"],
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
      "prettier"
    ],
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }
      ],
      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ]
    }
  };