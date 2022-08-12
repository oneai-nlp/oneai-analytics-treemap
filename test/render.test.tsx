import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AnalyticsTreemap } from '../src';

export const clusters = [
  {
    skill: 'CLUSTER-TOPICS',
    text: 'Buy the dip',
    items_count: 22,
    span_text: 'Buy the dip',
    phrases: [
      {
        text: 'Buy the dip',
        items_count: 11,
        phrases: {
          'Buy the dip': 6,
          'BUY the dip and HOLD': 1,
          "What's the old saying? Buy that dip?": 1,
          'I bought the dip': 2,
          'Buy the dips and hold': 1,
        },
      },
      {
        text: 'Buy the dip and hold! AMC',
        items_count: 3,
        phrases: {
          'Buy the dip and hold! AMC': 1,
          'AMC is bringing on a comeback. HOLD AND BUY AT THE DIP': 1,
          'Finally able to buy AMC shares again. BUY THE DIP': 1,
        },
      },
      {
        text: 'Buying The Dip 💎✋',
        items_count: 3,
        phrases: {
          'Buying The Dip 💎✋': 1,
          'Bought the Dip 🚀🦍': 1,
          'BUYING THE DIP! 🚀🚀🚀': 1,
        },
      },
      {
        text: 'Bought at the dip!',
        items_count: 5,
        phrases: {
          'Bought the dip!': 3,
          'Bought at the dip!': 1,
          'Bought in the dip': 1,
        },
      },
    ],
  },
  {
    skill: 'CLUSTER-TOPICS',
    text: 'GME &amp; AMC buy restrictions lifted on Revolut!',
    items_count: 6,
    span_text: 'GME &amp; AMC buy restrictions lifted on Revolut!',
    phrases: [
      {
        text: 'Revolut stopping GME &amp; AMC Buys',
        items_count: 4,
        phrases: {
          'Revolut stopping GME &amp; AMC Buys': 2,
          'Revolut suspends Buying GME AMC': 1,
          'Revolut is suspending buying on $GME and $AMC': 1,
        },
      },
      {
        text:
          'Revolut has been blocked by broker-dealer so now cannot buy GME &amp; AMC on that platform. 💎🙌',
        items_count: 2,
        phrases: {
          'Revolut has been blocked by broker-dealer so now cannot buy GME &amp; AMC on that platform. 💎🙌': 1,
          'Revolut no longer allow the buying of GME and AMC. You can only sell.': 1,
        },
      },
    ],
  },
  {
    skill: 'CLUSTER-TOPICS',
    text: 'Sndl🚀🚀🚀',
    items_count: 5,
    span_text: 'Sndl🚀🚀🚀',
    phrases: [
      {
        text: 'Sndl🚀🚀🚀',
        items_count: 3,
        phrases: {
          'Sndl🚀🚀🚀': 1,
          '💎': 1,
          '👉🏼😌🚀🚀🚀🚀🚀🌕': 1,
        },
      },
      {
        text: '💎🙌🙌🙌💎. 🦍🚀',
        items_count: 2,
        phrases: {
          '💎🙌🙌🙌💎. 🦍🚀': 1,
          '🦍. 💎🙌': 1,
        },
      },
    ],
  },
];

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<AnalyticsTreemap clusters={clusters} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
