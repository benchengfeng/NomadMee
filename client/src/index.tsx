import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store';
import * as serviceWorker from './serviceWorker';
import { initAnalytics } from './utils/analytics';

initAnalytics();

const container = document.getElementById('root')!;
createRoot(container).render(
  <Provider store={store}>
    <App />
  </Provider>
);

serviceWorker.unregister();
