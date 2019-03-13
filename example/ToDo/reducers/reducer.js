import {
  ADD_ITEM,
  CLEAR,
  RESET,
} from '../constants';

export const defaultState = {
  items: []
};

export function initReducer(actionsObservable) {
  actionsObservable.onAction(ADD_ITEM, addItem);

  actionsObservable.onAction([
    RESET,
    CLEAR,
  ], resetState);
}

function resetState() {
  return {
    ...defaultState,
  };
}

function addItem({ action, state }) {
  return {
    ...state,
    items: [
      ...state.items,
      action.payload,
    ],
  };
}
