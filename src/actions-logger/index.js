import { Subscriber } from 'rxjs';
import printBuffer from './core';
import { timer } from './helpers';
import defaults from './defaults';

/* eslint max-len: ["error", 110, { "ignoreComments": true }] */
/**
 * Creates logger with following options
 *
 * @namespace
 * @param {object} options - options for logger
 * @param {string | function | object} options.level - console[level]
 * @param {boolean} options.duration - print duration of each action?
 * @param {boolean} options.timestamp - print timestamp with each action?
 * @param {object} options.colors - custom colors
 * @param {object} options.logger - implementation of the `console` API
 * @param {boolean} options.logErrors - should errors in action execution be caught, logged, and re-thrown?
 * @param {boolean} options.collapsed - is group collapsed?
 * @param {boolean} options.predicate - condition which resolves logger behavior
 * @param {function} options.stateTransformer - transform state before print
 * @param {function} options.actionTransformer - transform action before print
 * @param {function} options.errorTransformer - transform error before print
 *
 * @returns {function} logger middleware
 */
function createLogger(options = {}) {
  const loggerOptions = Object.assign({}, defaults, options);

  const {
    logger,
    errorTransformer,
    predicate,
    diffPredicate,
    subject,
  } = loggerOptions;

  // Return if 'console' object is not defined
  if (typeof logger === 'undefined') {
    return;
  }

  const logBuffer = [];

  const createLogEntry = function createLogEntry(action) {
    return {
      ...(action || {}).metadata,
      action,
    };
  };

  const subscriber = Subscriber.create(
    // next
    ({ action, state }) => {
      // Exit early if predicate function returns 'false'
      if (typeof predicate === 'function' && !predicate(state, action)) {
        return;
      }

      const logEntry = createLogEntry(action);

      logEntry.took = timer.now() - logEntry.started;

      const diff = loggerOptions.diff && typeof diffPredicate === 'function'
        ? diffPredicate(state, action)
        : loggerOptions.diff;

      printBuffer([ logEntry ], Object.assign({}, loggerOptions, { diff }));
      logBuffer.length = 0;
    },
    // error
    (error) => {
      const { action, state } = subject.getValue();
      const logEntry = createLogEntry(action);
      logEntry.error = errorTransformer(error);

      logEntry.took = timer.now() - logEntry.started;

      const diff = loggerOptions.diff && typeof diffPredicate === 'function'
        ? diffPredicate(state, {})
        : loggerOptions.diff;

      printBuffer([ logEntry ], Object.assign({}, loggerOptions, { diff }));

      if (logEntry.error) throw logEntry.error;
    },
    // complete
    () => {},
  );

  // TODO to add a flag to disable loggin into console, just don't subribe to subject
  subject.subscribe(subscriber);
}

// eslint-disable-next-line consistent-return
const defaultLogger = options => createLogger(options);

export { defaults, createLogger, defaultLogger as logger };

export default defaultLogger;
