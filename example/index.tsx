import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AnalyticsTreemap } from '../src';
import { clusters } from './example-clusters';

const App = () => {
  return (
    <div style={{ height: '80vh' }}>
      <AnalyticsTreemap clusters={clusters} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
