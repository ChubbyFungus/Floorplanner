import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { WallData, Point2D } from '../../types';
import { updateWall, deleteWall, addWall, splitWall } from '../../store/slices/floorPlannerSlice';
import { Paper, Slider, Button, Typography, Box, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance } from '../../utils/geometryUtils';

interface WallEditControlsProps {
  wall: WallData;
  onClose: () => void;
}

export const WallEditControls: React.FC<WallEditControlsProps> = ({ wall, onClose }) => {
  const dispatch = useDispatch();
  const [splitPosition, setSplitPosition] = useState(50); // Percentage along the wall

  const handleThicknessChange = (_event: Event, value: number | number[]) => {
    const updatedWall = { ...wall, thickness: value as number };
    dispatch(updateWall(updatedWall));
  };

  const handleHeightChange = (_event: Event, value: number | number[]) => {
    const updatedWall = { ...wall, height: value as number };
    dispatch(updateWall(updatedWall));
  };

  const handleDelete = () => {
    dispatch(deleteWall(wall.id));
    onClose();
  };

  const handleSplitWall = () => {
    if (!wall) return;

    const midPoint = {
      x: (wall.start.x + wall.end.x) / 2,
      y: (wall.start.y + wall.end.y) / 2
    };

    // Create two new walls from the split
    const wall1: WallData = {
      id: uuidv4(),
      type: 'straight',
      start: { ...wall.start },
      end: { ...midPoint },
      thickness: wall.thickness,
      height: wall.height
    };

    const wall2: WallData = {
      id: uuidv4(),
      type: 'straight',
      start: { ...midPoint },
      end: { ...wall.end },
      thickness: wall.thickness,
      height: wall.height
    };

    dispatch(splitWall({ originalWallId: wall.id, newWalls: [wall1, wall2] }));
  };

  // Calculate wall length for display
  const wallLength = calculateDistance(wall.start, wall.end);

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        padding: 2,
        width: 300,
        zIndex: 1000
      }}
    >
      <Typography variant="h6" gutterBottom>
        Wall Properties
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Length: {wallLength.toFixed(0)} pixels</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Thickness</Typography>
        <Slider
          value={wall.thickness}
          onChange={handleThicknessChange}
          min={1}
          max={50}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Height</Typography>
        <Slider
          value={wall.height}
          onChange={handleHeightChange}
          min={100}
          max={500}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Split Wall Position</Typography>
        <Slider
          value={splitPosition}
          onChange={(_e, value) => setSplitPosition(value as number)}
          valueLabelDisplay="auto"
        />
        <Tooltip title="Split wall at selected position">
          <IconButton onClick={handleSplitWall} color="primary">
            <ContentCutIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Tooltip title="Delete wall">
          <IconButton onClick={handleDelete} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default WallEditControls;
