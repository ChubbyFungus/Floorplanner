import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomData, WallData } from "../../types";
import { findRooms } from "../../utils/roomDetection";

interface RoomState {
  rooms: RoomData[];
  selectedRoomId: string | null;
  isEditing: boolean;
}

const initialState: RoomState = {
  rooms: [],
  selectedRoomId: null,
  isEditing: false
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
    deselectRoom: (state, _action: PayloadAction<{}>) => {
      state.selectedRoomId = null;
    },
    updateRoom: (state, action: PayloadAction<RoomData>) => {
      const index = state.rooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    },
    deleteRoom: (state, action: PayloadAction<string>) => {
      state.rooms = state.rooms.filter(r => r.id !== action.payload);
      if (state.selectedRoomId === action.payload) {
        state.selectedRoomId = null;
      }
    },
    setRoomName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const room = state.rooms.find(r => r.id === action.payload.id);
      if (room) {
        room.name = action.payload.name;
      }
    },
    startRoomEditing: (state, _action: PayloadAction<{}>) => {
      state.isEditing = true;
    },
    finishRoomEditing: (state, _action: PayloadAction<{}>) => {
      state.isEditing = false;
    }
  }
});

export const {
  detectRooms,
  selectRoom,
  deselectRoom,
  updateRoom,
  deleteRoom,
  setRoomName,
  startRoomEditing,
  finishRoomEditing
} = roomSlice.actions;

export default roomSlice.reducer;