import { Observable } from 'rxjs';
import get from 'lodash/get';

export const handleSuccessRx = (payload) => {
  const error = get(payload, 'body.errorCode') || get(payload, 'body.errorType');

  return error
    ? Observable.fromPromise(Promise.reject(payload))
    : Observable.fromPromise(Promise.resolve(payload));
};

export function runPromiseAction({ promiseCreator, types, args, actionsStream }) {
  // # 1 start action
  actionsStream.nextAction({
    type: types.init,
    payload: args,
  });

  const promise = promiseCreator(...args);

  const obs = Observable.fromPromise(promise);

  const mapped = obs
    .switchMap(handleSuccessRx)
    .takeUntil(
      actionsStream.filter(({ action }) => { // handle abort action
        if (action && action.type === types.abort) {
          if (promise.abort) {
            promise.abort();
          }

          return true;
        }

        return false;
      }));

  // # 2 in progress
  actionsStream.nextAction({
    type: types.pending,
    payload: promise,
  });

  const multicasted = mapped.publish();

  // # 3 is complete with success or error
  multicasted.subscribe((success) => {
    actionsStream.nextAction({
      type: types.fulfilled,
      payload: success,
    });
  }, (error) => {
    actionsStream.nextAction({
      type: types.rejected,
      payload: error,
    });
  });

  multicasted.connect();

  return multicasted;
}

export default runPromiseAction;
