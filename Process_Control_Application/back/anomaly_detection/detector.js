import { MongoClient } from 'mongodb';
import { IsolationForest } from 'isolation-forest';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { Readable } from 'stream';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let anomalies = [];
let anomalies2 = [];
let values = [];
let data_list_1 = [];
let data_list_2 = [];
data_list_1.length = 0;
data_list_2.length = 0;
const runIsolationForest = async (req, res) => {
    const { collectionName, valueKey, timeKey, nTrees, sampleSize, windowSize } = req.body; 
    const uri = process.env.MONGO;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db("Detection");
        const collection = database.collection(collectionName);
        const data_list = await collection.find({}, { projection: { [valueKey]: 1, [timeKey]: 1, "_id": 0 } }).toArray();
        if (!data_list.length) {
            res.status(404).send([]);
            return [];
        }

        const isolationForest = new IsolationForest(nTrees, sampleSize);
        values = data_list.map(item => [item[valueKey]]);
        isolationForest.fit(values);

        const scores = isolationForest.scores();
        let anomalies3 = []; 

        let windowScores = scores.slice(0, windowSize);
        let dynamicThreshold = calculateThreshold(windowScores);
        data_list_1.length = 0;
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] < dynamicThreshold) {
                anomalies3.push({
                    time: data_list[i][timeKey],
                    anomalyValue: data_list[i][valueKey]
                });
                data_list_1.push({
                    time: data_list[i][timeKey],
                    anomalyValue: data_list[i][valueKey]
                });
            } /*else {
                data_list_1.push({
                    time: data_list[i][timeKey],
                    normalValue: data_list[i][valueKey]
                });
            }*/

            if (i >= windowSize) {
                windowScores.shift();
                windowScores.push(scores[i]);
                dynamicThreshold = calculateThreshold(windowScores);
            }
        }

        anomalies3.sort((a, b) => {
            return new Date(a.time) - new Date(b.time);
        });

        res.json(anomalies3);
        return anomalies3;
    } catch (error) {
        console.error("Error running Isolation Forest:", error);
        res.status(500).send("Error running Isolation Forest");
        return [];
    } finally {
        await client.close();
    }
};

function calculateThreshold(scores) {
    const mean = scores.reduce((acc, val) => acc + val, 0) / scores.length;
    const stdDev = Math.sqrt(scores.map(score => Math.pow(score - mean, 2)).reduce((acc, val) => acc + val, 0) / scores.length);
    return mean - 1.5 * stdDev; 
}
const resetDataLists = () => {
    data_list_1.length = 0;
    data_list_2.length = 0;
};
const runOneClassSVMPython = async (req, res) => {
    
    const { collectionName, valueKey, timeKey, nu, kernel } = req.body;
    const uri = process.env.MONGO;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db("Detection");
        const collection = database.collection(collectionName);
        const data_list = await collection.find({}, { projection: { [valueKey]: 1, [timeKey]: 1, "_id": 0 } }).toArray();

        if (!data_list.length) {
            res.status(404).send([]);
            return [];
        }

        const uniqueData = [...new Map(data_list.map(item => [item[timeKey], item])).values()];
        const values = uniqueData.map(item => item[valueKey]);
        const times = uniqueData.map(item => item[timeKey]);

        const pythonProcess = spawn('python', [path.join(__dirname, 'one_class_svm_detector.py'), nu.toString(), kernel]);
        pythonProcess.stdin.write(JSON.stringify({values, times}));
        pythonProcess.stdin.end();

        let outputData = '';
        pythonProcess.stdout.on('data', (data) => outputData += data.toString());
        pythonProcess.stderr.on('data', (data) => console.error(`stderr: ${data}`));

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    data_list_2.length = 0;
                    const result = JSON.parse(outputData);
                    const anomaliesSorted = result.anomalies.sort((a, b) => new Date(a.time) - new Date(b.time));
                    data_list_2 = [...result.anomalies.sort((a, b) => new Date(a.time) - new Date(b.time)), ...result.normals.sort((a, b) => new Date(a.time) - new Date(b.time))];
                    res.json(anomaliesSorted);
                } catch (error) {
                    console.error("Error parsing Python output:", error);
                    res.status(500).send("Error processing data with Python");
                }
            } else {
                console.error("Python script exited with code", code);
                res.status(500).send("Error processing data with Python");
            }
        });
    } catch (error) {
        console.error("Error running One-Class SVM with Python:", error);
        res.status(500).send(error);
    } finally {
        await client.close();
    }
    
};

//console.log('Normal Data:', data_list_1);

export { runIsolationForest, anomalies, data_list_1, runOneClassSVMPython, data_list_2, resetDataLists };
