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
  // Provide default empty string if name is undefined
  const [editName, setEditName] = React.useState(room.name || '');

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(event.target.value);
  };

  const handleNameSubmit = () => {
    // Ensure we have a valid room ID
    if (!room.id) {
      console.error('Room ID is undefined');
      return;
    }
    dispatch(setRoomName({ id: room.id, name: editName }));
    onFinishEdit();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleNameSubmit();
    }
  };

  // Ensure position values are numbers, default to 0 if undefined
  const posX = typeof position.x === 'number' ? position.x : 0;
  const posY = typeof position.y === 'number' ? position.y : 0;

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        left: posX,
        top: posY,
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
          />
          <IconButton size="small" onClick={handleNameSubmit}>
            <CheckIcon />
          </IconButton>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">{room.name || 'Unnamed Room'}</Typography>
          <IconButton size="small" onClick={onStartEdit}>
            <EditIcon />
          </IconButton>
        </div>
      )}
    </Paper>
  );
};

export default RoomLabel;
