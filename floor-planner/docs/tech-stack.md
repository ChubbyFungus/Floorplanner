# Tech Stack Documentation

## Core Technologies

### React (v18.3.1)
- **Official Documentation**: [React.dev](https://react.dev/)
- Key Features Used:
  - Component Architecture
  - Hooks System
  - Concurrent Mode
  - Context API
  - Error Boundaries

### TypeScript (v5.2+)
- **Official Documentation**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Key Features Used:
  - Strict Type Checking
  - Advanced Type Inference
  - Decorator Support
  - Module Resolution
  - TSX Support

### Vite (v4.5+)
- **Official Documentation**: [Vite Guide](https://vitejs.dev/)
- Key Features:
  - Lightning Fast HMR
  - Rollup-based Build
  - TypeScript Native Support
  - Plugin Ecosystem

### Three.js Ecosystem
- **Versions**:
  - Three.js r158
  - @react-three/fiber v11
  - @react-three/drei v11
  - @react-three/postprocessing v8
- **Key Features**:
  - Physically-Based Rendering (PBR) Materials
  - Suspense-based Asset Loading
  - Custom GLSL Shaders
  - Post-Processing Effects Stack
  - Optimized Instanced Meshes

### Material-UI (MUI)
- **Official Documentation**: [MUI Getting Started](https://mui.com/material-ui/getting-started/)
- Key Features Used [^2]:
  - Component Library
  - Theming System
  - Responsive Design
  - Custom Styling
  - Grid System

[^2]: From MUI docs: "Material UI includes a comprehensive collection of prebuilt components that are ready for use in production right out of the box."

### Redux Toolkit (v2.2+)
- **Official Documentation**: [Redux Toolkit](https://redux-toolkit.js.org/)
- Key Features:
  - `configureStore` with DevTools
  - `createSlice` reducer logic
  - `createAsyncThunk` middleware
  - RTK Query API
  - TypeScript-first approach

[^3]: Features list from Redux Toolkit's "What's Included" section: https://redux-toolkit.js.org/introduction/getting-started

## Build Tools

### Vite
- **Official Documentation**: [Vite Guide](https://vitejs.dev/)
- Key Features:
  - Dev Server with HMR
  - Build Optimization
  - TypeScript Support
  - Plugin System

## Testing

### Vitest (v1.2+)
- **Official Documentation**: [Vitest](https://vitest.dev/)
- Key Features:
  - Vite-native Test Runner
  - TypeScript Support
  - Component Testing
  - Snapshot Testing
  - Benchmarking

### React Testing Library (v14.2+)
- **Official Documentation**: [Testing Library](https://testing-library.com/)
- Key Features:
  - User-Centric Testing
  - Accessibility Checks
  - Component Interaction
  - Async Testing

## Version Control Best Practices

### Git Workflow
1. Branch Strategy:
   - `main`: Production-ready code
   - `develop`: Integration branch
   - `feature/*`: New features
   - `fix/*`: Bug fixes
   - `release/*`: Version releases

2. Commit Guidelines:
   ```
   type(scope): description
   
   - type: feat, fix, docs, style, refactor, test, chore
   - scope: component or feature affected
   - description: clear, concise change description
   ```

3. Pull Request Process:
   - Clear description of changes
   - Link to related issues
   - Tests included
   - CI checks passing
