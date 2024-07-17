import { data_list_1, resetDataLists } from './IsolationForest.js'; // Import anomalies from detector.js
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 1900; 
const height = 600; 
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

// Function to generate a plot using anomalies data
const generatePlot = async (req, res) => {
    if (!data_list_1 || data_list_1.length === 0) {
        console.log('No data available to generate the plot.');
        return res.status(404).send('Data not found.');
    }
    const configuration = {
        type: 'scatter',
        data: {
            datasets: [/*{
                label: 'Normal Data',
                data: data_list_1.filter(a => a.normalValue !== undefined).map(d => ({ x: d.time, y: d.normalValue })),
                backgroundColor: 'blue'
            },*/ {
                label: 'Anomalies',
                data: data_list_1.filter(a => a.anomalyValue).map(d => ({ x: d.time, y: d.anomalyValue })),
                backgroundColor: 'red'
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    };

    const imageStream = await chartJSNodeCanvas.renderToStream(configuration);

    res.setHeader('Content-Type', 'image/png');

    imageStream.pipe(res);
    //console.log('Normal Data:', data_list_1);
    resetDataLists();
};

export { generatePlot };
