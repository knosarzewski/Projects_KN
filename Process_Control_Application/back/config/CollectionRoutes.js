import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://kacper_nosarzewski:AnomalyDetection2023@detection.a6vc1lf.mongodb.net/';
const client = new MongoClient(uri);

const collectionList = async (req, res) => {
  try {
    await client.connect();
    const databasesList = await client.db().admin().listDatabases();

    let collections = [];
    for (let dbInfo of databasesList.databases) {
      let db = client.db(dbInfo.name);
      let cols = await db.listCollections().toArray();
      collections = collections.concat(cols.map(col => ({ name: col.name, database: dbInfo.name })));
    }

    res.json(collections);
  } catch (e) {
    res.status(500).send('Failed to fetch collections: ' + e.message);
  } finally {
    await client.close();
  }
};

export default collectionList;
