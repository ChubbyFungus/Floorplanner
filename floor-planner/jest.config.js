module.exports = {
    testEnvironment: "jsdom",
    verbose: true,
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
    transform: {
      "^.+\\.(t|j)sx?$": ["babel-jest", { 
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      }]
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
      "\\.(css|less|sass|scss)$": "identity-obj-proxy",
      "\\.(png|jpg|jpeg|gif)$": "<rootDir>/__mocks__/fileMock.js",
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/dist/",
      "/coverage/"
    ]
};