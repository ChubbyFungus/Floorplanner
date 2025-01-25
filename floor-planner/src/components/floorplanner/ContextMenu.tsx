import React from 'react';
import { Menu, MenuItem, MenuList, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import AddIcon from '@mui/icons-material/Add';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Point2D } from '../../types';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAction: (action: string) => void;
  selectedType: string | null;
  clickPoint: Point2D | null;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  position, 
  onClose, 
  onAction, 
  selectedType,
  clickPoint 
}) => {
  if (!position) return null;

  return (
    <Menu
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        position
          ? { top: position.y, left: position.x }
          : undefined
      }
    >
      <MenuList>
        {selectedType === 'wall' && (
          <>
            <MenuItem onClick={() => onAction('split')}>
              <ContentCutIcon fontSize="small" sx={{ mr: 1 }} />
              Split Wall
            </MenuItem>
            <MenuItem onClick={() => onAction('newWall')}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              Create Wall from Here
            </MenuItem>
            <MenuItem onClick={() => onAction('curve')}>
              <ShowChartIcon fontSize="small" sx={{ mr: 1 }} />
              Curve Wall
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => onAction('delete')} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Wall
            </MenuItem>
          </>
        )}
        {selectedType === 'room' && (
          <>
            <MenuItem onClick={() => onAction('delete')} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Room
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
};

export default ContextMenu;