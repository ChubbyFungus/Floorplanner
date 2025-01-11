# Redux Store Changelog

## Initial Setup (f7fcc56)

### Store Configuration
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import floorPlannerReducer from './slices/floorPlannerSlice';
import uiReducer from './slices/uiSlice';
import roomToolReducer from './slices/roomToolSlice';

export const store = configureStore({
  reducer: {
    floorPlanner: floorPlannerReducer,
    ui: uiReducer,
    roomTool: roomToolReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Initial Slices

#### Floor Planner Slice
```typescript
// store/slices/floorPlannerSlice.ts
interface FloorPlannerState {
  walls: WallData[];
  wallInProgress: WallData | null;
}

const initialState: FloorPlannerState = {
  walls: [],
  wallInProgress: null
};

export const floorPlannerSlice = createSlice({
  name: 'floorPlanner',
  initialState,
  reducers: {
    startWall: (state, action: PayloadAction<Point2D>) => {
      state.wallInProgress = { start: action.payload, end: action.payload };
    },
    updateWallEnd: (state, action: PayloadAction<Point2D>) => {
      if (state.wallInProgress) {
        state.wallInProgress.end = action.payload;
      }
    }
  }
});
```

#### UI Slice
```typescript
// store/slices/uiSlice.ts
interface UiState {
  selectedTool: 'wall' | 'room' | null;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
}

const initialState: UiState = {
  selectedTool: null,
  angleSnapEnabled: false,
  angleSnapIncrement: 15
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectTool: (state, action: PayloadAction<'wall' | 'room' | null>) => {
      state.selectedTool = action.payload;
    },
    toggleAngleSnap: (state) => {
      state.angleSnapEnabled = !state.angleSnapEnabled;
    }
  }
});
```

## Major Changes

### 1. Room Tool Slice Improvements (f7c6d97)

#### Before
```typescript
// store/slices/roomToolSlice.ts
export const createRectangularRoom = createSlice({
  name: 'roomTool',
  initialState,
  reducers: {
    createRoom: (state, action: PayloadAction<{start: Point2D; end: Point2D}>) => {
      const { start, end } = action.payload;
      // Direct wall creation in reducer (problematic)
      state.walls.push(createWall(start, end));
    }
  }
});
```

#### After
```typescript
// store/slices/roomToolSlice.ts
export const createRectangularRoom = createAsyncThunk(
  'roomTool/createRectangularRoom',
  async (
    { start, end }: { start: Point2D; end: Point2D },
    { dispatch }
  ) => {
    // Create walls for room
    const walls: WallData[] = [
      { start, end: { x: end.x, y: start.y } },
      { start: { x: end.x, y: start.y }, end },
      { start: end, end: { x: start.x, y: end.y } },
      { start: { x: start.x, y: end.y }, end: start }
    ];
    
    // Dispatch wall actions instead of direct mutation
    walls.forEach(wall => {
      dispatch(addWall(wall));
    });
    
    return { start, end };
  }
);

const roomToolSlice = createSlice({
  name: 'roomTool',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createRectangularRoom.fulfilled, (state, action) => {
      state.lastRoomCreatedAt = Date.now();
    });
  }
});
```

**Changes:**
- Converted to async thunk
- Proper wall creation through actions
- Added completion tracking
- Improved error handling

### 2. Floor Planner Slice Enhancements (b8a6d16)

#### Wall Control Points
```typescript
// store/slices/floorPlannerSlice.ts
interface WallData {
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
}

export const floorPlannerSlice = createSlice({
  name: 'floorPlanner',
  initialState,
  reducers: {
    addWallControlPoint: (state, action: PayloadAction<Point2D[]>) => {
      if (state.wallInProgress) {
        state.wallInProgress.controlPoints = action.payload;
      }
    },
    updateLastControlPoint: (state, action: PayloadAction<Point2D>) => {
      if (state.wallInProgress?.controlPoints?.length) {
        const points = state.wallInProgress.controlPoints;
        points[points.length - 1] = action.payload;
      }
    }
  }
});
```

### 3. UI Slice Additions (ce40605)

```typescript
// store/slices/uiSlice.ts
interface UiState {
  selectedTool: 'wall' | 'room' | null;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
  gridEnabled: boolean;
  gridSize: number;
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setAngleSnapIncrement: (state, action: PayloadAction<number>) => {
      state.angleSnapIncrement = action.payload;
    },
    toggleGrid: (state) => {
      state.gridEnabled = !state.gridEnabled;
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
    }
  }
});
```

### 4. Store Configuration Update (213e102)

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { 
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector
} from 'react-redux';

export const store = configureStore({
  reducer: {
    floorPlanner: floorPlannerReducer,
    ui: uiReducer,
    roomTool: roomToolReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['roomTool/createRectangularRoom/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates']
      }
    })
});

// Typed versions of useDispatch and useSelector
export const useDispatch = () => useReduxDispatch<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
```

## Type System Improvements

### 1. Action Types
```typescript
// types/index.ts
export interface Point2D {
  x: number;
  y: number;
}

export interface WallData {
  start: Point2D;
  end: Point2D;
  controlPoints?: Point2D[];
  id?: string;
}

export interface RoomData {
  walls: WallData[];
  id: string;
  createdAt: number;
}
```

### 2. State Types
```typescript
// store/slices/types.ts
export interface FloorPlannerState {
  walls: WallData[];
  wallInProgress: WallData | null;
  selectedWallId: string | null;
}

export interface UiState {
  selectedTool: 'wall' | 'room' | null;
  angleSnapEnabled: boolean;
  angleSnapIncrement: number;
  gridEnabled: boolean;
  gridSize: number;
  theme: 'light' | 'dark';
}

export interface RoomToolState {
  rooms: RoomData[];
  lastRoomCreatedAt: number | null;
}
```

## Performance Optimizations

### 1. Selector Memoization
```typescript
// store/selectors/floorPlannerSelectors.ts
export const selectWalls = (state: RootState) => state.floorPlanner.walls;

export const selectWallById = createSelector(
  [selectWalls, (_, id: string) => id],
  (walls, id) => walls.find(wall => wall.id === id)
);

export const selectConnectedWalls = createSelector(
  [selectWalls, (_, point: Point2D) => point],
  (walls, point) => walls.filter(wall => 
    isPointConnectedToWall(point, wall)
  )
);
```

### 2. Action Batching
```typescript
// store/actions/roomActions.ts
export const createRoom = (start: Point2D, end: Point2D) => (dispatch: AppDispatch) => {
  batch(() => {
    dispatch(startRoomCreation());
    dispatch(createRectangularRoom({ start, end }));
    dispatch(completeRoomCreation());
  });
};
```

## Future Improvements

### 1. Planned Features
- Undo/Redo functionality
- State persistence
- Room templates

### 2. Performance
- Normalized state shape
- Selective rerendering
- Action debouncing

### 3. Type Safety
- Stricter action types
- Runtime type checking
- Validation middleware
