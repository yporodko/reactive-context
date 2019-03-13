import { Observable } from 'rxjs';
import { get } from 'lodash';
import superagent from 'superagent';
import createActionsStream from 'reactive-context/create-actions-stream';
import { runPromiseAction } from 'reactive-context/run-promise-action';

import { initReducer, defaultState } from './reducers/reducer';

import {
  ADD_ITEM,
  RESET,
  CLEAR,
  FETCH_ITEMS,
  FETCH_ITEMS_ABORT,
  FETCH_ITEMS_FULFILLED,
  FETCH_ITEMS_PENDING,
  FETCH_ITEMS_REJECTED,
} from '../constants';

export const actionsStream = createActionsStream({
  initialState: defaultState,
});

initReducer(actionsStream);

export const handleSuccessRx = (payload) => {
  const error = get(payload, 'body.errorCode') || get(payload, 'body.errorType');

  return error
    ? Observable.fromPromise(Promise.reject(payload))
    : Observable.fromPromise(Promise.resolve(payload));
};

export function addItem(item) {
  return {
    type: ADD_ITEM,
    payload: item,
  }
}

export function reset() {
  return {
    type: RESET,
  }
}

export function clear() {
  return {
    type: CLEAR,
  }
}

export function fetchItemsAbort() {
  actionsStream.markActionToHaveHandler(FETCH_ITEMS_ABORT);

  actionsStream.nextAction({
    type: FETCH_ITEMS_ABORT,
  });
}

export function fetchItems({ url, kind }) {
  return runPromiseAction({
    args: { // for logging
      url, kind,
    },
    promiseCreator: () => {
      const queryParams = {
        kind,
      };

      const agent = new superagent({
        get: {
          url,
          query: queryParams,
        },
      });

      const promise = agent.get();

      promise.abort = agent.abort.bind(agent); // need to expose abort

      return promise;
    },
    types: {
      init: FETCH_ITEMS,
      pending: FETCH_ITEMS_PENDING,
      fulfilled: FETCH_ITEMS_FULFILLED,
      rejected: FETCH_ITEMS_REJECTED,
      abort: FETCH_ITEMS_ABORT,
    },
    actionsStream,
  });
}