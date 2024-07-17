// DeleteCollectionForm.js

import React, { useState } from 'react';
import axios from 'axios';

function DeleteCollectionForm() {
    const [collectionName, setCollectionName] = useState('');

    const handleCollectionNameChange = (event) => {
        setCollectionName(event.target.value);
    };

    const handleDelete = async (event) => {
        event.preventDefault();
        try {
            await axios.post('http://localhost:7000/api/anomaly/delete-collection', { collectionName }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            alert('Collection deleted successfully');
        } catch (error) {
            alert('Error deleting collection');
        }
    };

    return (
        <div>
            <h2>Delete MongoDB Collection</h2>
            <form onSubmit={handleDelete}>
                <input
                    type="text"
                    value={collectionName}
                    onChange={handleCollectionNameChange}
                    placeholder="Collection Name"
                    required
                />
                <button type="submit" className="App-button" >Delete Collection</button>
            </form>
        </div>
    );
}

export default DeleteCollectionForm;
