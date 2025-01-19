import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
      import { startWall, finishWall } from "./floorPlannerSlice";
      import type { AppDispatch } from "../store";
      import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from "../../constants/dimensions";
      import { Point2D, RoomData, WallData } from '../../types';
      import { v4 as uuidv4 } from 'uuid';

      /**
       * Describes a rectangular room to be created at given coordinates.
       */
      export interface CreateRoomPayload {
        startX: number;
        startY: number;
        width: number;
        depth: number;
        thickness: number;
        height: number;
      }

      /**
       * createRectangularRoom
       * Async thunk that batch-creates four walls in a rectangle.
       */
      export const createRectangularRoom = createAsyncThunk<void, CreateRoomPayload, { dispatch: AppDispatch }>(
        "roomTool/createRectangularRoom",
        async (payload, { dispatch }) => {
          const { startX, startY, width, depth } = payload;

          // Construct four new walls
          const walls: WallData[] = [
            {
              id: uuidv4(),
              start: { x: startX, y: startY },
              end: { x: startX + width, y: startY },
              thickness: DEFAULT_WALL_THICKNESS,
              height: DEFAULT_WALL_HEIGHT,
              type: 'straight'
            },
            {
              id: uuidv4(),
              start: { x: startX + width, y: startY },
              end: { x: startX + width, y: startY + depth },
              thickness: DEFAULT_WALL_THICKNESS,
              height: DEFAULT_WALL_HEIGHT,
              type: 'straight'
            },
            {
              id: uuidv4(),
              start: { x: startX + width, y: startY + depth },
              end: { x: startX, y: startY + depth },
              thickness: DEFAULT_WALL_THICKNESS,
              height: DEFAULT_WALL_HEIGHT,
              type: 'straight'
            },
            {
              id: uuidv4(),
              start: { x: startX, y: startY + depth },
              end: { x: startX, y: startY },
              thickness: DEFAULT_WALL_THICKNESS,
              height: DEFAULT_WALL_HEIGHT,
              type: 'straight'
            }
          ];

          // Dispatch them one by one
          for (const wall of walls) {
            dispatch(startWall(wall));
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
        name: 'roomTool',
        initialState,
        reducers: {
          addRoom: (state, action: PayloadAction<RoomData>) => {
            state.rooms.push(action.payload);
          },
          updateRoom: (state, action: PayloadAction<RoomData>) => {
            const index = state.rooms.findIndex(room => room.id === action.payload.id);
            if (index !== -1) {
              state.rooms[index] = action.payload;
            }
          },
          deleteRoom: (state, action: PayloadAction<string>) => {
            state.rooms = state.rooms.filter(room => room.id !== action.payload);
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
            // No additional state changes required here
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