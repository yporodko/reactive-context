import {
  BehaviorSubject,
} from 'rxjs';
import { timer } from './actions-logger/helpers';
import defaultLogger from './actions-logger';

/**
 *
 * interface Action: {
 *   type: String,
 *   payload: any
 * }
 *
 * interface actionsObservable {
 *   // BehaviorSubject that outputs result action handler
 *   output: BehaviorSubject
 *
 *   // trigger action
 *   nextAction(action: Action)
 *
 *   // register action handler, one per action
 *   onAction(actionType: String, fn: Function)
 *
 *   // returns current state
 *   getValue()
 *
 *   // mark action that has a side effect but it is not modifying state
 *   markActionToHaveHandler(actionType: String)
 * }
 *
 * @param {Object} options
 * @param {Object} options.initialState - initial state for the output
 *
 * @returns {Observable} actionsObservable
 */
export default function createActionsStream({
  initialState,
}) {
  const inputSubject = new BehaviorSubject({
    state: initialState,
  });

  const outputSubject = new BehaviorSubject({
    state: initialState,
  });

  const output = outputSubject.asObservable();
  output.getValue = outputSubject.getValue.bind(outputSubject);

  const actionsWithHandlers = new Set();

  // split into two observables: actions with handlers and without
  const partitioned = inputSubject
    .filter(v => v && v.action && v.state)
    .map((data) => {
      if (data.action) {
        data.action.metadata = { // eslint-disable-line
          ...data.action.metadata,
          started: timer.now(),
          startedTime: new Date(),
        };
      }

      return data;
    })
    .partition(({ action }) => action && actionsWithHandlers.has(action.type));

  const actionsObservable = partitioned[0];
  const firedActionsWithoutHandlers = partitioned[1]
    .map(({ action, state }) => {
      action.metadata.flags = [ 'No Handler' ]; // eslint-disable-line

      return {
        action,
        state,
      };
    });

  firedActionsWithoutHandlers.getValue = inputSubject.getValue.bind(inputSubject);

  actionsObservable.nextAction = function nextAction(action) {
    const state = outputSubject.getValue().state;

    action.metadata = { // eslint-disable-line
      ...action.metadata,
      prevState: state,
    };

    inputSubject.next({
      action,
      state,
    });
  };
  actionsObservable.onAction = (actionType, fn) => {
    let observer;

    if (Array.isArray(actionType)) {
      actionType.forEach(actionType => actionsWithHandlers.add(actionType));
      observer = actionsObservable.filter(({ action }) => actionType.indexOf(action.type) > -1);
    } else {
      actionsWithHandlers.add(actionType);
      observer = actionsObservable.filter(({ action }) => action.type === actionType);
    }

    observer = observer
      .map(({ action, state }) => {
        let nextState = state;

        try {
          nextState = fn({ action, state });

          action.metadata.nextState = nextState; // eslint-disable-line
        } catch (e) {
          action.metadata.error = e; // eslint-disable-line no-param-reassign
        }

        return {
          action,
          state: nextState,
        };
      });

    observer.subscribe(
      outputSubject.next.bind(outputSubject),
      outputSubject.error.bind(outputSubject),
    );
  };

  actionsObservable.getValue = outputSubject.getValue.bind(outputSubject);
  actionsObservable.markActionToHaveHandler = function markActionToHaveHandler(actionType) {
    actionsWithHandlers.add(actionType);
  };

  const outputObservable = outputSubject.filter(v => v && v.action && v.state);
  actionsObservable.output = outputObservable;

  defaultLogger({
    subject: firedActionsWithoutHandlers,
    flags: true,
    collapsed: true,
  });

  defaultLogger({
    subject: outputSubject,
    collapsed: true,
  });

  return actionsObservable;
}
