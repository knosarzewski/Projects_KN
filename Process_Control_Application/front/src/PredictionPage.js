import React, { useState } from 'react';
import './App.css';
import * as XLSX from 'xlsx';

function App4() {
  const [formData, setFormData] = useState({
    Cykl: '',
    Temp_min: '',
    Temp_max: ''
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: parseFloat(value) // Ensure values are numbers
    }));
  };

  const handleSubmit2 = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:7000/api/anomaly/predict-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setError('Server responded with an error.');
        setResults([]);
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
    XLSX.writeFile(wb, "Chemical_Compound.xlsx");
  };

return (
    <div className="App-page">
      <form onSubmit={handleSubmit2}>
        <label htmlFor="Cykl">Number of Cycles</label>
        <input type="number" name="Cykl" value={formData.Cykl} onChange={handleChange} />

        <label htmlFor="Temp_min">Minimum Temperature Value</label>
        <input type="number" name="Temp_min" value={formData.Temp_min} onChange={handleChange} />

        <label htmlFor="Temp_max">Maximum Temperature Value</label>
        <input type="number" name="Temp_max" value={formData.Temp_max} onChange={handleChange} />

        <button type="submit">Start Prediction</button>
      </form>

      {isLoading ? <div>Loading...</div> : null}
      {error && <div className="error-message">{error}</div>}
      {results.length > 0 && (
        <div>
          <h2>Chemical Compound Prediction Results</h2>
          <button onClick={exportToExcel}>Export to Excel</button>
          <table>
            <thead>
              <tr>
                <th>Element name</th>
                <th>Element Value</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.ElementName}</td>
                  <td>{result.ElementValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App4;
