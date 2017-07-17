import React from 'react';
import { render } from 'react-dom'
import './index.css';
import App from './containers/App';

// Redux imports
import { Provider } from 'react-redux'
import initMock from './services/mock'

import store  from './store'

initMock(store)

const rootEl = document.getElementById('root')


render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootEl
)
