import  express  from "express";
import { runOneClassSVMPython } from "../anomaly_detection/OneClassSVM.js";
import { runIsolationForest } from "../anomaly_detection/IsolationForest.js";
import { generatePlot } from "../anomaly_detection/diagrams.js";
import { generatePlot2 } from "../anomaly_detection/diagrams2.js";
//import { generateHtmlForAnomalyMethods } from "../anomaly_detection/methods.js";
import { handleExcelUpload } from "../config/UploadExel.js";
import deleteCollection from '../config/DeleteCollection.js';
import collectionList from "../config/CollectionRoutes.js";
import { trainModel } from "../Prediction/Predict6.js"

const router = express.Router();

//router.post("/"); //opis i rozwijana lista z wyborem rodzaju algorytmu 
//router.get('/method', generateHtmlForAnomalyMethods);

router.post("/Isolation-Forest", runIsolationForest);

router.post("/One-Class-SVM", runOneClassSVMPython);

router.get("/diagrams", generatePlot)

router.get("/diagrams2", generatePlot2)

router.post("/upload", handleExcelUpload);

router.post('/delete-collection', deleteCollection);

router.get('/collections', collectionList);

router.post('/predict-composition', trainModel);

export default router;

//"dev": "nodemon --exec 'node --max-old-space-size=4096 ' server.js",
// "start": "node --max-old-space-size=8096 node_modules/react-scripts/bin/react-scripts.js start",