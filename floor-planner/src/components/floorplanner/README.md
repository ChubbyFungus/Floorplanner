# Floorplanner Components

This folder contains React components and utilities for both **2D** and **3D** floor planning.

## Overview

- **FloorPlanner2D**: Renders a canvas for drawing walls, tracking mouse/touch events, and handling snapping or measurement overlays.
- **FloorPlanner3D**: Uses React Three Fiber to visualize the floor plan in 3D, adding basic lighting, orbit controls, and fixture geometry.

## Contents

- **FloorPlanner2D.tsx**  
  - A canvas-based 2D drawing tool: user clicks define walls, with optional grid snapping and angle snapping.
  - Basic measurement labels are drawn alongside each wall.

- **FloorPlanner3D.tsx**  
  - Wraps the `Canvas` from R3F to display walls/fixtures in 3D.
  - Delegates geometry creation to `Scene3D` and sub-components (e.g., `Fixture3D`).

- **MaterialLibrary3D.tsx**  
  - Provides a material preloading system for textures or basic colors, used by 3D fixtures/walls.

- **drawing.ts**  
  - Contains reusable drawing logic for 2D lines, curves, and measurement text overlays.

## Workflow

1. **User Input**: In `FloorPlanner2D`, user clicks start or finish a wall in progress.  
2. **Redux Store**: Actions (e.g., `startWall`, `updateWallEnd`, `finishWall`) maintain a single source of truth for walls/fixtures.  
3. **Rendering**:  
   - 2D: `drawing.ts` uses plain Canvas APIs for lines, curves, and measurement text.  
   - 3D: `FloorPlanner3D` + `Scene3D` generate a Three.js scene with walls extruded or represented via boxes.

## Future Extensions

- **Curved Tools**: Expand `drawing.ts` to handle more advanced curves or arcs.  
- **AI Layout Suggestions**: Optionally pass the Redux state to an AI module for design tips.  
- **Advanced Materials**: Incorporate normal/bump maps or advanced shading in `MaterialLibrary3D`.  

## Documentation Guidelines

- **In-Line Comments**: Place short descriptive comments in each component or function, especially around geometry or event handling logic.
- **API Contracts**: If exporting data (JSON floor plan), store a reference doc explaining fields (`id`, `start`, `end`, etc.).
- **README Updates**: Keep this file updated as new modules (e.g., `Grid.tsx`, `Wall3D.tsx`) are added.