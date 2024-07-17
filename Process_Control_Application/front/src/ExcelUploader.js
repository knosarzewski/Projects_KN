import React, { useState } from 'react';
import axios from 'axios';

function ExcelUploader() {
  const [files, setFiles] = useState([]); 
  const [collectionName, setCollectionName] = useState('');

  const handleFilesChange = (event) => {
    setFiles(event.target.files); 
  };

  const handleCollectionNameChange = (event) => {
    setCollectionName(event.target.value);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('collectionName', collectionName);

    try {
      await axios.post('http://localhost:7000/api/anomaly/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Files uploaded successfully');
    } catch (error) {
      alert('Error uploading files');
    }
  };

  return (
    <div className="upload-section">
      <h2>Upload Excel Files to MongoDB</h2>
      <form onSubmit={handleFormSubmit}>
        <input type="text" value={collectionName} onChange={handleCollectionNameChange} placeholder="Collection Name" required />
        <input type="file" multiple onChange={handleFilesChange} accept=".xlsx" required />
        <button type="submit" className="App-button">Insert Data</button>
      </form>
    </div>
  );
}

export default ExcelUploader;
