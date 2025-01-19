import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { startWall, finishWall } from "./floorPlannerSlice";
// CHANGED: now import from src/constants.ts (or hardcode if you like)
import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from "../../constants"; 
import { v4 as uuidv4 } from "uuid";
import { Point2D, RoomData, WallData } from "../../types";
import type { AppDispatch } from "../store";

interface RectangularRoomPoints {
  start: Point2D;
  end: Point2D;
}

/**
 * createRectangularRoom
 * Skips rectangles smaller than 5x5 in canvas units to avoid partial or single-wall scenarios.
 */
export const createRectangularRoom = createAsyncThunk<
  void,
  RectangularRoomPoints,
  { dispatch: AppDispatch }
>(
  "roomTool/createRectangularRoom",
  async ({ start, end }, { dispatch }) => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const width = maxX - minX;
    const depth = maxY - minY;

    if (width < 5 || depth < 5) {
      return;
    }

    const walls: WallData[] = [
      {
        id: uuidv4(),
        type: "straight",
        start: { x: minX, y: minY },
        end: { x: maxX, y: minY },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: maxX, y: minY },
        end: { x: maxX, y: maxY },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: maxX, y: maxY },
        end: { x: minX, y: maxY },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      },
      {
        id: uuidv4(),
        type: "straight",
        start: { x: minX, y: maxY },
        end: { x: minX, y: minY },
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT
      }
    ];

    for (const w of walls) {
      dispatch(startWall(w));
      dispatch(finishWall());
    }
  }
);

interface RoomToolState {
  rooms: RoomData[];
  selectedRoomId: string | null;
  showRoomLabels: boolean;
  isRoomToolActive: boolean;
  roomInProgress: RoomData | null;
}

const initialState: RoomToolState = {
  rooms: [],
  selectedRoomId: null,
  showRoomLabels: true,
  isRoomToolActive: false,
  roomInProgress: null
};

const roomToolSlice = createSlice({
  name: "roomTool",
  initialState,
  reducers: {
    addRoom: (state, action: PayloadAction<RoomData>) => {
      state.rooms.push(action.payload);
    },
    updateRoom: (state, action: PayloadAction<RoomData>) => {
      const idx = state.rooms.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.rooms[idx] = action.payload;
      }
    },
    deleteRoom: (state, action: PayloadAction<string>) => {
      state.rooms = state.rooms.filter((room) => room.id !== action.payload);
      if (state.selectedRoomId === action.payload) {
        state.selectedRoomId = null;
      }
    },
    selectRoom: (state, action: PayloadAction<string | null>) => {
      state.selectedRoomId = action.payload;
    },
    toggleRoomLabels: (state) => {
      state.showRoomLabels = !state.showRoomLabels;
    },
    setRoomToolActive: (state, action: PayloadAction<boolean>) => {
      state.isRoomToolActive = action.payload;
    },
    clearRooms: (state) => {
      state.rooms = [];
      state.selectedRoomId = null;
    },
    startRoom: (state, action: PayloadAction<RoomData>) => {
      state.roomInProgress = action.payload;
    },
    finishRoom: (state) => {
      if (state.roomInProgress) {
        state.rooms.push(state.roomInProgress);
        state.roomInProgress = null;
      }
    },
    cancelRoom: (state) => {
      state.roomInProgress = null;
    },
    updateRoomInProgress: (state, action: PayloadAction<Point2D>) => {
      if (state.roomInProgress) {
        state.roomInProgress.points.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(createRectangularRoom.fulfilled, () => {
      // No special state updates needed
    });
  }
});

export const {
  addRoom,
  updateRoom,
  deleteRoom,
  selectRoom,
  toggleRoomLabels,
  setRoomToolActive,
  clearRooms,
  startRoom,
  finishRoom,
  cancelRoom,
  updateRoomInProgress
} = roomToolSlice.actions;

export default roomToolSlice.reducer;