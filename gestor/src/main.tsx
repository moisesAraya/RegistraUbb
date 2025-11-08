import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // ✅ Debe apuntar al App.tsx correcto
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
