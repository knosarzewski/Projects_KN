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

const resetDataLists = () => {
    data_list_1.length = 0;
    data_list_2.length = 0;
};


//console.log('Normal Data:', data_list_1);
export {  anomalies, data_list_1, runOneClassSVMPython, data_list_2, resetDataLists };
