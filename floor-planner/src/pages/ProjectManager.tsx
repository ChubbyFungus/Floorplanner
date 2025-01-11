import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setProjects,
  removeProject,
  selectProject,
  setLoading
} from "../store/slices/projectManagerSlice";
import { RootState } from "../store";
import { Box, Container, Typography, Button, CircularProgress } from "@mui/material";
import { getProjectsFromServer } from "../utils/projectApi";
import { ProjectData } from "../types";

function ProjectManager() {
  const dispatch = useDispatch();
  const { projects, selectedProjectId, loading } = useSelector(
    (state: RootState) => state.projectManager
  );

  const handleFetchProjects = async () => {
    dispatch(setLoading(true));
    try {
      const data: ProjectData[] = await getProjectsFromServer();
      dispatch(setProjects(data));
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRemoveProject = (id: string) => {
    dispatch(removeProject(id));
  };

  const handleSelectProject = (id: string) => {
    dispatch(selectProject(id));
  };

  useEffect(() => {
    handleFetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Project Manager
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {projects.length === 0 ? (
              <Typography variant="body1">
                No projects found. Try adding one.
              </Typography>
            ) : (
              projects.map((project) => (
                <Box
                  key={project.id}
                  p={2}
                  mt={2}
                  border="1px solid #ccc"
                  borderRadius="4px"
                >
                  <Typography variant="h6">{project.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {project.description}
                  </Typography>
                  <Box mt={1} display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={() => handleRemoveProject(project.id)}
                    >
                      Remove
                    </Button>
                    <Button
                      variant={
                        selectedProjectId === project.id
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => handleSelectProject(project.id)}
                    >
                      {selectedProjectId === project.id
                        ? "Selected"
                        : "Select"}
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default ProjectManager;
