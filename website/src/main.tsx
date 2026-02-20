import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { ReaderProvider } from './context/ReaderContext';

// Global error handler to suppress extension-related errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.message?.includes('Could not establish connection. Receiving end does not exist.') ||
    event.reason.message?.includes('The message port closed before a response was received.')
  )) {
    event.preventDefault();
    // Intentionally silent to avoid console flood
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReaderProvider>
      <App />
    </ReaderProvider>
  </React.StrictMode>
);

