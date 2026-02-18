import { ReaderProvider } from './context/ReaderContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReaderProvider>
      <App />
    </ReaderProvider>
  </React.StrictMode>
);

