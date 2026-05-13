import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Create } from './pages/Create';
import { Created } from './pages/Created';
import { Room } from './pages/Room';
import { Admin } from './pages/Admin';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Create />} />
        <Route path="/created" element={<Created />} />
        <Route path="/r/:id" element={<Room />} />
        <Route path="/r/:id/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
