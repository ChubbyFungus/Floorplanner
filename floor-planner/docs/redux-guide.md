# Redux Implementation Guide

## Store Configuration [^1]

Our Redux store is configured using Redux Toolkit's `configureStore`:

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import floorPlannerReducer from './slices/floorPlannerSlice'
import projectManagerReducer from './slices/projectManagerSlice'

export const store = configureStore({
  reducer: {
    floorPlanner: floorPlannerReducer,
    projectManager: projectManagerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore certain paths for non-serializable data
        ignoredActions: ['some/action'],
        ignoredPaths: ['some.path'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

## Redux Toolkit Features [^2]

### CreateSlice Pattern
```typescript
// store/slices/floorPlannerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface FloorPlannerState {
  walls: Wall[]
  fixtures: Fixture[]
  selectedItemId: string | null
  mode: 'draw' | 'select' | 'measure'
}

const initialState: FloorPlannerState = {
  walls: [],
  fixtures: [],
  selectedItemId: null,
  mode: 'select',
}

const floorPlannerSlice = createSlice({
  name: 'floorPlanner',
  initialState,
  reducers: {
    addWall: (state, action: PayloadAction<Wall>) => {
      state.walls.push(action.payload)
    },
    removeWall: (state, action: PayloadAction<string>) => {
      state.walls = state.walls.filter(wall => wall.id !== action.payload)
    },
    // ... other reducers
  },
})

export const { addWall, removeWall } = floorPlannerSlice.actions
export default floorPlannerSlice.reducer
```

### Async Operations with createAsyncThunk [^3]
```typescript
// store/slices/projectManagerSlice.ts
import { createAsyncThunk } from '@reduxjs/toolkit'
import { projectApi } from '../../utils/projectApi'

export const fetchProjects = createAsyncThunk(
  'projectManager/fetchProjects',
  async () => {
    const response = await projectApi.getProjects()
    return response.data
  }
)

const projectManagerSlice = createSlice({
  name: 'projectManager',
  initialState,
  reducers: {
    // ... sync reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  },
})
```

## Type-Safe Redux Usage [^4]

### Custom Hooks
```typescript
// hooks/useAppDispatch.ts
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store/store'

export const useAppDispatch = () => useDispatch<AppDispatch>()

// hooks/useAppSelector.ts
import { TypedUseSelectorHook, useSelector } from 'react-redux'
import type { RootState } from '../store/store'

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

### Memoized Selectors
```typescript
// store/selectors/floorPlannerSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../store'

export const selectWalls = (state: RootState) => state.floorPlanner.walls

export const selectWallsByRoom = createSelector(
  [selectWalls, (state, roomId: string) => roomId],
  (walls, roomId) => walls.filter(wall => wall.roomId === roomId)
)
```

## Best Practices

### 1. State Structure
- Keep state normalized [^5]
- Use IDs for relationships
- Avoid deeply nested state

### 2. Action Naming
- Use descriptive names
- Follow Redux Toolkit conventions
- Document complex actions

### 3. Performance Optimization
- Use memoized selectors
- Avoid unnecessary re-renders
- Implement shallowEqual comparisons when needed

### 4. Error Management
- Handle async errors in thunks
- Provide user feedback
- Implement proper error logging

### 5. Testing Strategy
- Test reducers independently
- Mock async operations
- Utilize Redux Toolkit's testing utilities

[^1]: Configuration based on Redux Toolkit's configureStore API
[^2]: Features from Redux Toolkit's "What's Included" section
[^3]: Async operations pattern from Redux Toolkit's createAsyncThunk documentation
[^4]: TypeScript integration based on official Redux TypeScript guidelines
[^5]: State structure recommendations from Redux Style Guide
