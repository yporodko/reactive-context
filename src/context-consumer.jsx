import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import noop from 'lodash/noop';

function defaultMapFn(...data) {
  return data.reduce((acc, d) => ({ ...acc, ...d }), {});
}

const context = React.createContext();


/**
 * Decorator to map context consumers to component
 *
 * @param {Object} options - options object
 * @param {Function} options.mapFn - function that will map data from context consumer(s) to Component props. Args are (...sources, this.props)
 * @param {Array<React.Consumer>} options.sources - list of React Context Consumers
 * @param {React.Consumer} options.source - single React Context Consumer
 */
export default function contextConsumer(options) {
  return (Component) => {
    const sources = get(options, 'sources', []);
    const source = get(options, 'source');
    const mapFn = get(options, 'mapFn', defaultMapFn);

    if (source) {
      sources.push(source);
    }

    if (sources.length === 0) {
      throw new Error(`Error in contextConsumer(${Component.displayName || Component.name}). No any sources provided`);
    }

    sources.forEach((source, i) => {
      if (source.$$typeof !== context.$$typeof) {
        // eslint-disable-next-line
        throw new Error(`Error in contextConsumer(${Component.displayName || Component.name}), source index ${i}. Passed source is not an instance of React.ContextConsumer`);
      }
    });

    return class extends React.Component {
      static WrappedComponent = Component

      static displayName = `contextConsumer(${Component.displayName || Component.name})`

      static propTypes = {
        wrappedComponentRef: PropTypes.func,
      }

      static defaultProps = {
        wrappedComponentRef: noop,
      }

      constructor(props) {
        super(props);

        this.sources = sources;
        this.mapFn = mapFn;

        this.state = {
          length: this.sources.length,
        };
      }

      renderRecurisve = (Component, sources, result = []) => {
        if (sources.length === 0) {
          const mappedProps = mapFn(...result, this.props);

          return (
            <Component
              {...this.props}
              {...mappedProps}
              ref={this.props.wrappedComponentRef}
            />
          );
        }

        const Consumer = sources[0];

        return (
          <Consumer>
            {data => this.renderRecurisve(Component, sources.slice(1), [ ...result, data ])}
          </Consumer>
        );
      }

      render() {
        return this.renderRecurisve(Component, sources);
      }
    };
  };
}
