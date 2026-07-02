import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { useGame, player } from '@/state/store';
import './styles.css';

// Dev-only: expose the store for debugging/e2e in the browser console.
if (import.meta.env.DEV) {
  window.__game = useGame;
  window.__player = player;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
