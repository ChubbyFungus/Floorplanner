import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, IconButton, Paper, Typography, Slider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HeightIcon from '@mui/icons-material/Height';
import { WallData } from '../../types/types';
import { updateWall, removeWall } from '../../store/slices/floorPlannerSlice';

interface WallEditControlsProps {
  wall: WallData;
  onClose: () => void;
}

export const WallEditControls: React.FC<WallEditControlsProps> = ({ wall, onClose }) => {
  const dispatch = useDispatch();

  const handleThicknessChange = (_event: Event, value: number | number[]) => {
    dispatch(updateWall({
      ...wall,
      thickness: value as number
    }));
  };

  const handleHeightChange = (_event: Event, value: number | number[]) => {
    dispatch(updateWall({
      ...wall,
      height: value as number
    }));
  };

  const handleDelete = () => {
    dispatch(removeWall(wall.id));
    onClose();
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        p: 2,
        width: 300,
        zIndex: 1000
      }}
    >
      <Typography variant="h6" gutterBottom>
        Wall Properties
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>
          Thickness (cm)
        </Typography>
        <Slider
          value={wall.thickness}
          onChange={handleThicknessChange}
          min={5}
          max={50}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>
          Height (cm)
        </Typography>
        <Slider
          value={wall.height}
          onChange={handleHeightChange}
          min={200}
          max={400}
          step={10}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <IconButton 
          onClick={handleDelete}
          color="error"
          title="Delete wall"
        >
          <DeleteIcon />
        </IconButton>
        <IconButton 
          onClick={onClose}
          color="primary"
          title="Close"
        >
          <HeightIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default WallEditControls;
