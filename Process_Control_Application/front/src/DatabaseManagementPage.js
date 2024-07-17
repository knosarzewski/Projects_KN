// DatabaseManagementPage.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExcelUploader from './ExcelUploader';
import DeleteCollectionForm from './DeleteCollectionForm';

function DatabaseManagementPage() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get('http://localhost:7000/api/anomaly/collections');
        setCollections(response.data);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="App-header">
      <h2>Collection list and maintanance</h2>
      <ul>
        {collections.map((col, index) => (
          <li key={index}>{col.name} in {col.database}</li>
        ))}
      </ul>
      <ExcelUploader />
      <DeleteCollectionForm />
    </div>
  );
}

export default DatabaseManagementPage;
