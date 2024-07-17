const generateHtmlForAnomalyMethods= async (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wybór metody detekcji anomalii</title>
        <style>
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin: 10px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border: none;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <h1>Wybierz metodę detekcji anomalii</h1>
        <a href="/api/anomaly/detection" class="button">Isolation Forest</a>
        <a href="/api/anomaly/detection2" class="button">SVM</a>
    </body>
    </html>
  `);
        }

  export { generateHtmlForAnomalyMethods };