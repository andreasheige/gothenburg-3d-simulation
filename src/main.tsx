import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { useGame } from '@/state/store';
import './styles.css';

// Dev-only: expose the store for debugging/e2e in the browser console.
if (import.meta.env.DEV) window.__game = useGame;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
