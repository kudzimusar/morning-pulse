import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { ReaderProvider } from './context/ReaderContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReaderProvider>
      <App />
    </ReaderProvider>
  </React.StrictMode>
);

