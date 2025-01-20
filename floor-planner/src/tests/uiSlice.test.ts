import { describe, it, expect } from 'vitest';
import uiReducer, {
  UiState,
  toggleGrid,
  toggleSnapToGrid,
  toggleMeasurements,
  toggleTapeMeasure,
  toggleAiTips,
  setErrorMessage
} from '../store/slices/uiSlice';

describe('uiSlice', () => {
  it('toggles grid visibility', () => {
    const initialState: UiState = {
      showGrid: true,
      snapToGrid: true,
      snapGridSize: 20,
      angleSnapEnabled: true,
      angleSnapIncrement: 45,
      showRoomLabels: true,
      showTooltips: false,
      selectedTool: 'select',
      errorMessage: null,
      showMeasurements: false,
      tapeMeasureActive: false,
      aiTipsOpen: false
    };
    const newState = uiReducer(initialState, toggleGrid());
    expect(newState.showGrid).toBe(false);
  });

  it('toggles snap to grid', () => {
    const state = uiReducer(undefined, toggleSnapToGrid());
    expect(state.snapToGrid).toBe(false);
  });

  it('toggles measurements', () => {
    const state = uiReducer(undefined, toggleMeasurements());
    expect(state.showMeasurements).toBe(true);
  });

  it('toggles tape measure', () => {
    const state = uiReducer(undefined, toggleTapeMeasure());
    expect(state.tapeMeasureActive).toBe(true);
  });

  it('toggles AI tips', () => {
    const state = uiReducer(undefined, toggleAiTips());
    expect(state.aiTipsOpen).toBe(true);
  });

  it('sets an error message', () => {
    const state = uiReducer(undefined, setErrorMessage('Something went wrong'));
    expect(state.errorMessage).toBe('Something went wrong');
  });
});