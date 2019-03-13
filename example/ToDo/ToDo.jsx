import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import noop from 'lodash/noop';
import find from 'lodash/find';
import reduce from 'lodash/reduce';

import {
  clear,
} from './actions';

import contextConsumer from 'reactive-context/context-consumer';
import { ToDoConsumer } from './context';

@contextConsumer({
  sources: [
    ToDoConsumer,
  ],
  mapFn: (todo, props) => {
    const items = get(todo, 'items', []);

   
    return {
      items,
      reset: todo.reset, // action
    };
  },
})
export default class ToDo extends React.Component {
  render() {
    const {
      items,
      reset,
    } = this.props;

    return (
      <div>
        <button onClick={reset}>
          reset (mapped action)
        </button>
        <button onClick={clear}>
          clear (direct action usage)
        </button>
        <ul>
          {items.map((item) => {
            return (
              <li key={item.id}>
                {item.name}
              </li>
            )
          })}
        </ul>
      </div>
    );
  }
}
