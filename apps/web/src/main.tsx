import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { Gallery } from './gallery/Gallery';
import './theme/tokens.css';
import './theme/base.css';

const root = document.getElementById('root');
if (root === null) throw new Error('The page has no #root to draw the app in.');

// "?gallery" shows every token and component as built.
const showGallery = new URLSearchParams(window.location.search).has('gallery');
createRoot(root).render(<StrictMode>{showGallery ? <Gallery /> : <App />}</StrictMode>);
