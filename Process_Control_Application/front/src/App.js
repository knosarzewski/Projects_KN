import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IsolationForestPage from './IsolationForestPage';
import SvmPage from './SvmPage';
import DatabaseManagementPage from './DatabaseManagementPage';
import PredictionPage from './PredictionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Główna strona aplikacji */}
        <Route path="/" element={
          <header className="App-header">
            <h1>Application for process control</h1>
            <p className="App-author">Autor: Kacper Nosarzewski</p>
            <nav>
              {/* Linki do stron funkcji */}
              <a href="/anomaly/Isolation-Forest" className="App-button" target="_blank" rel="noopener noreferrer">Isolation Forest</a>
              <a href="/anomaly/One-Class-SVM" className="App-button" target="_blank" rel="noopener noreferrer">One-Class SVM</a>
              <a href="/predict-composition" className="App-button" target="_blank" rel="noopener noreferrer">Prediction</a>
              <a href="/database-management" className="App-button" target="_blank" rel="noopener noreferrer">Maintain Database</a>
            </nav>
          </header>
        } />
        {/* Strony poszczególnych funkcji */}
        <Route path="/anomaly/Isolation-Forest" element={<IsolationForestPage />} />
        <Route path="/anomaly/One-Class-SVM" element={<SvmPage />} />
        <Route path="/predict-composition" element={<PredictionPage />} />
        <Route path="/database-management" element={<DatabaseManagementPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;