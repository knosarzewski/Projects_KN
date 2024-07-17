import { MongoClient } from 'mongodb';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
//wersja ze skalowaniem bez filtrów
// MongoDB URI and database name
const mongoUri = process.env.MONGO;
const dbName = 'Detection';
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

async function getAllTrainingData(db, cykl, tempMin, tempMax) {
    const collectionNames = await db.listCollections({}, { nameOnly: true }).toArray();
    let allTrainingData = [];

    for (let collection of collectionNames) {
        if (collection.name !== 'CH_C') {
            const data = await db.collection(collection.name).find({
                Cykl: cykl,
                Temperatura: { $gte: tempMin , $lte: tempMax }
            }).toArray();
            allTrainingData.push(...data.map(doc => [doc.Cykl, doc.Temperatura]));
        }
    }

    return allTrainingData;
}

async function getLabels(db) {
    const labelsData = await db.collection('CH_C').find({}).toArray();
    return labelsData.map(doc => [doc.C, doc.Si, doc.Mn, doc.Mg, doc.Cu, doc.Ni, doc.Mo, doc.V, doc.Co, doc.Sb]);
}

async function trainModel(req, res) {
    const { Cykl, Temp_min, Temp_max } = req.body;

    try {
        await client.connect();
        const db = client.db(dbName);
        
        const allTrainingData = await getAllTrainingData(db, Cykl, Temp_min, Temp_max);
        const labels = await getLabels(db);

        const pythonProcess = spawn('python', [path.join(__dirname, 'pytorch_network3.py')]);
        pythonProcess.stdin.write(JSON.stringify({ inputs: allTrainingData, labels: labels }));
        pythonProcess.stdin.end();

        let outputData = '';
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        pythonProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error('Python script finished running with the code', code);
                res.status(500).send('Python script error');
            } else {
                try {
                    const parsedData = JSON.parse(outputData);
                    const formattedResults = parsedData.map(item => ({
                        ElementName: item.name,
                        ElementValue: item.value
                    }));
                    res.json(formattedResults); // Wyślij te sformatowane dane do frontendu
                } catch (error) {
                    console.error('Error when analyzing Python data:', error);
                    res.status(500).send('Error when analyzing Python data');
                }
            }
        });

    } catch (error) {
        console.error('Error while running the model:', error);
        res.status(500).send('Error while running the model');
    } finally {
        await client.close();
    }
};

export { trainModel };
