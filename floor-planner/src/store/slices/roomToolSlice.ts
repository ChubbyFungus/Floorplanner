import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { addWall } from "./floorPlannerSlice";
import type { AppDispatch } from "../index";

// The payload describing the rectangle
export interface CreateRoomPayload {
  startX: number;
  startY: number;
  width: number;
  depth: number;
  thickness: number;
  height: number;
}

// Create an async thunk instead of a synchronous action
export const createRectangularRoom = createAsyncThunk<void, CreateRoomPayload, { dispatch: AppDispatch }>(
  "roomTool/createRectangularRoom",
  async (payload, { dispatch }) => {
    const { startX, startY, width, depth, thickness, height } = payload;

    // 1) top edge
    dispatch(addWall({
      id: crypto.randomUUID(),
      start: { x: startX, y: startY },
      end: { x: startX + width, y: startY },
      thickness,
      height
    }));

    // 2) right edge
    dispatch(addWall({
      id: crypto.randomUUID(),
      start: { x: startX + width, y: startY },
      end: { x: startX + width, y: startY + depth },
      thickness,
      height
    }));

    // 3) bottom edge
    dispatch(addWall({
      id: crypto.randomUUID(),
      start: { x: startX + width, y: startY + depth },
      end: { x: startX, y: startY + depth },
      thickness,
      height
    }));

    // 4) left edge
    dispatch(addWall({
      id: crypto.randomUUID(),
      start: { x: startX, y: startY + depth },
      end: { x: startX, y: startY },
      thickness,
      height
    }));
  }
);

interface RoomToolState {
  lastRoomCreatedAt: string | null;
}

const initialState: RoomToolState = {
  lastRoomCreatedAt: null
};

const roomToolSlice = createSlice({
  name: "roomTool",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createRectangularRoom.fulfilled, (state) => {
      state.lastRoomCreatedAt = new Date().toISOString();
    });
  }
});

export default roomToolSlice.reducer;
