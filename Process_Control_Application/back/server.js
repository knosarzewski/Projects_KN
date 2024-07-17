import dotenv from 'dotenv'
import  express  from 'express';
import cors from 'cors'
import { connectDB } from './config/db.js';
import anomalyrouter from "./Routs/AnomalyRouter2.js"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Api is running 2');
});

const Port = process.env.Port || 7000;


app.use("/api/anomaly", anomalyrouter);

app.listen(Port, () => {
  console.log(`Server Running in http://localhost/${Port}`);
});

