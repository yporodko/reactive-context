# reactive-context

this repo is WIP

example usage:

1. create a actions stream
```
import createActionsStream from 'reactive-context/create-actions-stream';

export const actionsStream = createActionsStream({
  initialState: defaultState,
});
```