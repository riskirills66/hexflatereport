import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

if (import.meta.env.VITE_WEB_TITLE) {
  document.title = import.meta.env.VITE_WEB_TITLE;
}

if (import.meta.env.VITE_WEB_FAVICON) {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = import.meta.env.VITE_WEB_FAVICON;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = import.meta.env.VITE_WEB_FAVICON;
    document.head.appendChild(newLink);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
