const express = require('express');
const axios = require('axios');
const { Parser } = require('json2csv');
const fs = require('fs');
const app = express();
const port = 3000;

const cities = {
    "Praia Grande":"455987",
    "Itanhaem":"456259",
    "Guaruja":"455952",
    "Ubatuba":"456586",
    "São Sebastião":"456532",
    "Rio de Janeiro":"455825",
    "Cabo Frio":"426480",
    "Salvador":"455826",
    "Angra dos Reis":"456038",
    "São Paulo":"455827"
};

app.get('/consultar', async (req, res) => {
    const apiKey = req.query.apikey;
    if (!apiKey) {
        return res.status(400).send('API key is required');
    }

    try {
        const allData = [];

        for (const city in cities) {
            const woeid = cities[city];
            const response = await axios.get('https://api.hgbrasil.com/weather', {
                params: { key: apiKey, woeid: woeid }
            });

            const data = response.data.results;
            const forecasts = data.forecast;

            forecasts.forEach(forecast => {
                allData.push({
                    city: city,
                    date: forecast.date,
                    weekday: forecast.weekday,
                    max: forecast.max,
                    min: forecast.min,
                    humidity: forecast.humidity,
                    cloudiness: forecast.cloudiness,
                    rain: forecast.rain,
                    rain_probability: forecast.rain_probability,
                    wind_speedy: forecast.wind_speedy,
                    description: forecast.description
                });
            });
        }

        // Convert JSON to CSV
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(allData);

        // Save the CSV file
        fs.writeFileSync('forecast_output.csv', csv);

        // Send the CSV file as response
        res.setHeader('Content-Disposition', 'attachment; filename=forecast_output.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
