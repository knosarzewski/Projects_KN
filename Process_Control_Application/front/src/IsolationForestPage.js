import React, { useState } from 'react';
import './App.css';
import * as XLSX from 'xlsx'; 
function App2() {
  const [formData, setFormData] = useState({
    collectionName: '',
    valueKey: '',
    timeKey: '',
    nTrees: '',
    sampleSize: '',
    anomalyThreshold: ''
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:7000/api/anomaly/Isolation-Forest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
        } else {
          setError('No results found.');
          setResults([]);
        }
      } else {
        setError('Server responded with an error.');
      }
    } catch (error) {
      setError(`Failed to fetch: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "results.xlsx");
  };

  const navigateToDiagrams = () => {
    window.location.href = 'http://localhost:7000/api/anomaly/diagrams';
  };

  return (
    <div className="App-page">
      <form onSubmit={handleSubmit}>
        {/* Existing input fields */}
        <label htmlFor="collectionName"className="label-background">Name of the Tested Collection</label>
        <input name="collectionName" value={formData.collectionName} onChange={handleChange} placeholder="Collection Name" className="form-input" />
        
        <label htmlFor="valueKey"className="label-background">Name of the Analyzed Variable</label>
        <input name="valueKey" value={formData.valueKey} onChange={handleChange} placeholder="Value Key" className="form-input" />
        
        <label htmlFor="timeKey"className="label-background">Time Variable</label>
        <input name="timeKey" value={formData.timeKey} onChange={handleChange} placeholder="Time Key" className="form-input" />
        
        <label htmlFor="nTrees"className="label-background">Number of Insulation Trees</label>
        <input type="number" name="nTrees" value={formData.nTrees} onChange={handleChange} placeholder="Number of Trees" className="form-input" />
        
        <label htmlFor="sampleSize"className="label-background">Number of Samples for Building Each Tree</label>
        <input type="number" name="sampleSize" value={formData.sampleSize} onChange={handleChange} placeholder="Sample Size" className="form-input" />
        
        <label htmlFor="windowSize"className="label-background">Window Size</label>
        <input type="number" name="windowSize" value={formData.windowSize} onChange={handleChange} placeholder="Window Size" className="form-input" />

        {/*}
        <label htmlFor="batchSize"className="label-background">Batch Size</label>
        <input type="number" name="batchSize" value={formData.batchSize} onChange={handleChange} placeholder="Batch Size" className="form-input" />
  */}
        <button type="submit" className="form-button">Start</button>
        
        <button onClick={navigateToDiagrams} className="form-button">Diagrams</button>
      </form>
      

      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {results.length > 0 && (
            <>
              <h2>Isolation Forest</h2>
              <div>Total Anomalies Found: {results.length}</div>
              <button onClick={exportToExcel}>Export to Excel</button>
            </>
          )}
          <table>
            {/* Table headers and rows for displaying results */}
            <thead>
              <tr>
                <th>Row Number</th>
                <th>Time</th>
                <th>Anomaly Value</th>
                {/*<th>Score</th>*/}
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{result.time}</td>
                  <td>{result.anomalyValue}</td>
                  {/*<td>{result.score}</td>*/}
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && !error && <div>No results to display.</div>}
        </>
      )}
    </div>
  );
}

export default App2;
