// DeleteCollection.js

import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://kacper_nosarzewski:AnomalyDetection2023@detection.a6vc1lf.mongodb.net/';
const db_name = 'Detection';

const deleteCollection = async (req, res) => {
    const collectionName = req.body.collectionName;
    if (!collectionName) {
        return res.status(400).send('Collection name is required');
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db(db_name);
        
        await database.collection(collectionName).drop();
        res.status(200).send("Collection successfully deleted.");
    } catch (error) {
        res.status(500).send("Error deleting collection: " + error.message);
    } finally {
        await client.close();
    }
};

export default deleteCollection;
