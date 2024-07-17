import React, { useState } from 'react';
import './App.css';

function App3() {
  // Twoje istniejące stany i funkcje
  const [diagramURL, setDiagramURL] = useState('');
  const [isDiagramLoading, setIsDiagramLoading] = useState(false);

  // Dodana funkcja do pobierania wykresów
  const fetchDiagrams = async () => {
    setIsDiagramLoading(true);
    const url = 'http://localhost:7000/api/anomaly/diagrams';
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.imageUrl) {
        setDiagramURL(data.imageUrl);
      } else {
        console.error('Brak URL obrazu w odpowiedzi');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania wykresu:', error);
    } finally {
      setIsDiagramLoading(false);
    }
  };


  return (
    <div className="App3">
      <button onClick={fetchDiagrams} className="form-button">Pokaż Wykresy</button>

      {isDiagramLoading ? (
        <div>Ładowanie wykresu...</div>
      ) : diagramURL ? (
        <img src={diagramURL} alt="Wykres anomalii" />
      ) : null}
    </div>
  );
}

export default App3;
