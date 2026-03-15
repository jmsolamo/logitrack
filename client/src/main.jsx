import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress known React 18 flushSync warning from @base-ui-components/react
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('flushSync was called from inside a lifecycle method')) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('flushSync was called from inside a lifecycle method')) {
    return;
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
