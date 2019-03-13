import React from 'react';
import noop from 'lodash/noop';
import { shallow, mount } from 'enzyme';
import objProxy from 'identity-obj-proxy';

import contextConsumer from './context-consumer';

describe('context-consumer()', () => {
  const Comp = () => {};
  Comp.displayName = 'Comp';

  test('consumes valid consumers', () => {
    const context = React.createContext();

    expect(() => {
      contextConsumer({
        source: context.Consumer,
      })(Comp);
    }).not.toThrow();
  });

  test('fails with not valid source', () => {
    const targetError = new Error(`Error in contextConsumer(${Comp.displayName}), source index 0. Passed source is not an instance of React.ContextConsumer`);

    expect(() => {
      contextConsumer({
        source: {},
      })(Comp);
    }).toThrow(targetError);

    expect(() => {
      contextConsumer({
        sources: [ {} ],
      })(Comp);
    }).toThrow(targetError);
  });

  test('failes without sources', () => {
    const noSourcesError = new Error(`Error in contextConsumer(${Comp.displayName || Comp.name}). No any sources provided`);

    expect(() => {
      contextConsumer({
      })(Comp);
    }).toThrow(noSourcesError);

    expect(() => {
      contextConsumer({
        sources: [],
      })(Comp);
    }).toThrow(noSourcesError);
  });
});
