import { MongoClient } from 'mongodb';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
//wersja ze skalowaniem z filtrami
// MongoDB URI and database name
const mongoUri = process.env.MONGO;
const dbName = 'Detection';
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

async function getMaxCyklValue(db, collectionName) {
    const maxCyklPipeline = [
        { $sort: { Cykl: -1 } },
        { $limit: 1 },
        { $project: { Cykl: 1 } }
    ];
    const maxCyklDoc = await db.collection(collectionName).aggregate(maxCyklPipeline).toArray();
    return maxCyklDoc.length > 0 ? maxCyklDoc[0].Cykl : null;
}

async function processBatch(db, collectionName, query, cykl, allTrainingData, sampleNames, batchSize = 100000) {
    const collection = db.collection(collectionName);
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const data = await collection.find(query).skip(skip).limit(batchSize).toArray();

        if (data.length > 0) {
            allTrainingData.push(...data.map(doc => [doc.Cykl, doc.Temperatura]));
            sampleNames.push(collectionName);
            skip += batchSize;
        } else {
            hasMore = false;
        }
    }
}

async function getAllTrainingData(db, cykl, tempMin, tempMax) {
    const collectionNames = await db.listCollections({}, { nameOnly: true }).toArray();
    let allTrainingData = [];
    let sampleNames = [];

    //console.log("Kolekcje znalezione w bazie danych:", collectionNames);

    for (let collection of collectionNames) {
        if (collection.name !== 'CH_C') {
            const maxCyklValue = await getMaxCyklValue(db, collection.name);
            //console.log(`Maksymalna wartość Cykl w kolekcji ${collection.name}:`, maxCyklValue);

            if (cykl < 5000 && maxCyklValue > 5000) {
                //console.log(`Ignorowanie kolekcji ${collection.name} ponieważ maksymalna wartość Cykl jest większa niż 5000 a wymagany Cykl < 5000`);
                continue;
            }

            let query = { Temperatura: { $gte: tempMin, $lte: tempMax } };

            if (cykl >= 5000) {
                query.Cykl = { $gte: 5000 };
            } else {
                query.Cykl = { $lte: cykl };
            }

           // console.log(`Zapytanie dla kolekcji ${collection.name}:`, query);
            try {
                await processBatch(db, collection.name, query, cykl, allTrainingData, sampleNames);
            } catch (error) {
                console.error(`Error processing batch for collection ${collection.name}:`, error);
            }
        }
    }

    //console.log("Nazwy próbek po przefiltrowaniu:", JSON.stringify(sampleNames, null, 2));

    return { allTrainingData, sampleNames };
}

async function getLabels(db, sampleNames) {
    const labelsData = await db.collection('CH_C').find({ Nazwa: { $in: sampleNames } }).toArray();
   // console.log("Labels data:", JSON.stringify(labelsData, null, 2));  // Logowanie danych etykiet

    if (labelsData.length === 0) {
        console.log("No labels found matching the sample names");
    }

    return sampleNames.map(name => {
        const match = labelsData.find(doc => doc.Nazwa === name);
        return match ? [match.C, match.Si, match.Mn, match.Mg, match.Cu, match.Ni, match.Mo, match.V, match.Co, match.Sb] : null;
    }).filter(item => item !== null);
}

async function trainModel(req, res) {
    const { Cykl, Temp_min, Temp_max } = req.body;

    try {
        await client.connect();
        const db = client.db(dbName);
        
        const { allTrainingData, sampleNames } = await getAllTrainingData(db, Cykl, Temp_min, Temp_max);
        const labels = await getLabels(db, sampleNames);

        if (labels.length === 0) {
            res.status(400).send("No labels found matching the sample names");
            return;
        }

        const inputData = { inputs: allTrainingData, labels: labels };
        //console.log("Input data to Python:", JSON.stringify(inputData));

        const pythonProcess = spawn('python', [path.join(__dirname, 'pytorch_network2.py')]);
        //const pythonProcess = spawn('python', [path.join(__dirname, 'pytorch_network4.py')]);
        pythonProcess.stdin.write(JSON.stringify(inputData));
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
                   // console.log("Output data from Python:", outputData);
                    const parsedData = JSON.parse(outputData);
                    //console.log("Parsed data:", parsedData);
                    if (!Array.isArray(parsedData)) {
                        throw new TypeError("Unexpected response format");
                    }
                    if (parsedData.length > 0 && parsedData[0].error) {
                        res.status(500).send(parsedData[0].error);
                    } else {
                        const formattedResults = parsedData.map(item => ({
                            ElementName: item.name,
                            ElementValue: item.value
                        }));
                        res.json(formattedResults);
                    }
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