import multer from 'multer';
import xlsx from 'xlsx';
import { MongoClient } from 'mongodb';

// Konfiguracja multer dla obsługi przesyłania plików
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array('files', 20); // Możesz zmienić limit plików zgodnie z potrzebami

// Konfiguracja MongoDB
const db_name = 'Detection';
const uri = 'mongodb+srv://kacper_nosarzewski:AnomalyDetection2023@detection.a6vc1lf.mongodb.net/';

// Funkcja obsługi przesyłania i przetwarzania plików Excel
const handleExcelUpload = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: "Upload error", error: err });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('No files uploaded');
        }
        const client = new MongoClient(uri);
        try {
            await client.connect();
            const database = client.db(db_name);
            const collectionName = req.body.collectionName; // Nazwa kolekcji przekazywana w formie danych
            const collection = database.collection(collectionName);
            
            for (const file of req.files) {
                const workbook = xlsx.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = xlsx.utils.sheet_to_json(worksheet);
                await collection.insertMany(jsonData);
            }
            
            await client.close();
            res.status(200).send("Data imported successfully into MongoDB.");
        } catch (error) {
            if (client) await client.close();
            res.status(500).send("Server error: " + error.message);
        }
    });
};

export { handleExcelUpload };
