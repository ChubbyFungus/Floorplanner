module.exports = {
    testEnvironment: "jsdom",
    verbose: true,
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
    transform: {
      "^.+\\.(t|j)sx?$": "babel-jest"
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
      "\\.(css|less|sass|scss)$": "identity-obj-proxy",
      "\\.(png|jpg|jpeg|gif)$": "<rootDir>/__mocks__/fileMock.js"
    },
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/dist/",
      "/coverage/"
    ]
  };
  