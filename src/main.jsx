import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'

const app = createRoot(document.getElementById('app'));
app.render(
  <StrictMode>
    <App />
  </StrictMode>
);