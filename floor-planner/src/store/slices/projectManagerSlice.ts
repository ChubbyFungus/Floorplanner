
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProjectData } from "../../types";

interface ProjectManagerState {
  projects: ProjectData[];
  selectedProjectId: string | null;
  loading: boolean;
}

const initialState: ProjectManagerState = {
  projects: [],
  selectedProjectId: null,
  loading: false
};

const projectManagerSlice = createSlice({
  name: "projectManager",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<ProjectData[]>) => {
      state.projects = action.payload;
    },
    addProject: (state, action: PayloadAction<ProjectData>) => {
      state.projects.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
    selectProject: (state, action: PayloadAction<string>) => {
      state.selectedProjectId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  }
});

export const {
  setProjects,
  addProject,
  removeProject,
  selectProject,
  setLoading
} = projectManagerSlice.actions;

export default projectManagerSlice.reducer;
