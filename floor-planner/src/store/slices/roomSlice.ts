import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomData, WallData } from "../../types/types";
import { findRooms } from "../../utils/roomDetection";

interface RoomState {
  rooms: RoomData[];
  selectedRoomId: string | null;
  // We rely on uiSlice for the global showRoomLabels, but might local-override if needed
}

const initialState: RoomState = {
  rooms: [],
  selectedRoomId: null
};

export const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    detectRooms: (state, action: PayloadAction<{ walls: WallData[] }>) => {
      state.rooms = findRooms(action.payload.walls);
    },
    selectRoom: (state, action: PayloadAction<string | null>) => {
      state.selectedRoomId = action.payload;
    },
    updateRoom: (state, action: PayloadAction<RoomData>) => {
      const index = state.rooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    }
  }
});

export const { detectRooms, selectRoom, updateRoom } = roomSlice.actions;
export default roomSlice.reducer;