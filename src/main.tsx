import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import DriftFilm from './promo/DriftFilm.tsx';
import './index.css';

const root = createRoot(document.getElementById('root')!);
const film = window.location.pathname === '/film' || window.location.hash === '#film';

root.render(film ? <DriftFilm /> : (
  <StrictMode>
    <App />
  </StrictMode>
));
