import React from 'react';
import PropTypes from 'prop-types';

import {
  fetchItems,
  fetchItemsAbort,
  actionsStream,
  reset,
} from './actions';

const ToDoContext = React.createContext();

export const ToDoConsumer = ToDoContext.Consumer;

export class ToDoProvider extends React.Component {

  static defaultProps = {
    todoItemsUrl: process.env.TODO_ITEMS_URL,
  }

  state = {
    ...actionsStream.getValue().state,
    reset,
    fetchItems: () => fetchItems({ // one of the ways of passing actions
      url: this.props.itemsUrl,
    }),
    fetchItemsAbort,
  };

  componentDidMount() {
    fetchItems({ // action may be called directly
      url: this.props.todoItemsUrl,
    });

    this.subscription = actionsStream.output.subscribe(({ state }) => {
      this.setState(state);
    });
  }

  componentWillUnmount() {
    fetchItemsAbort();
    this.subscription.unsubscribe();
  }


  render() {
    return (
      <ToDoContext.Provider value={this.state}>
        {this.props.children}
      </ToDoContext.Provider>
    );
  }
}

