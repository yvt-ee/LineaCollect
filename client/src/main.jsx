// src/main.jsx  

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from "./context/AuthContext";   // ⭐ 关键一步
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>     {/* 👈 必须包住 App */}
        <App />
      </AuthProvider>    {/* 👈 必须包住 App */}
    </BrowserRouter>
  </React.StrictMode>
);
