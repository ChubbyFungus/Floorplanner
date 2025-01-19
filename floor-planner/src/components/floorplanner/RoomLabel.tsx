import React from 'react';
import { useDispatch } from 'react-redux';
import { Paper, Typography, IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { RoomData, Point2D } from '../../types';
import { setRoomName } from '../../store/slices/roomSlice';

interface RoomLabelProps {
  room: RoomData;
  position: Point2D;
  isEditing: boolean;
  onStartEdit: () => void;
  onFinishEdit: () => void;
}

export const RoomLabel: React.FC<RoomLabelProps> = ({
  room,
  position,
  isEditing,
  onStartEdit,
  onFinishEdit
}) => {
  const dispatch = useDispatch();
  const [editName, setEditName] = React.useState(room.name);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(event.target.value);
  };

  const handleNameSubmit = () => {
    dispatch(setRoomName({ id: room.id, name: editName }));
    onFinishEdit();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleNameSubmit();
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        padding: 1,
        minWidth: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1000
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            size="small"
            value={editName}
            onChange={handleNameChange}
            onKeyPress={handleKeyPress}
            autoFocus
            sx={{ marginRight: 1 }}
          />
          <IconButton
            size="small"
            onClick={handleNameSubmit}
            color="primary"
          >
            <CheckIcon />
          </IconButton>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ marginRight: 1 }}>
            {room.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(room.area)}m²
          </Typography>
          <IconButton
            size="small"
            onClick={onStartEdit}
            sx={{ marginLeft: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </div>
      )}
    </Paper>
  );
};

export default RoomLabel;
