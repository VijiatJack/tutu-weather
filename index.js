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

const moonPhases = {
    "new": "Nova",
    "waxing_crescent": "Minguante",
    "first_quarter": "Quarto Minguante",
    "waxing_gibbous": "Minguante Gibosa",
    "full": "Cheia",
    "waning_gibbous": "Crescente Gibosa",
    "third_quarter": "Quarto Crescente",
    "waning_crescent": "Crescente",
}

app.get('/', (req, res) => {
  res.send(`[${new Date().toLocaleDateString("en-GB")}] - The application is running today!!`);
});

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
      
        const generationDate = new Date().toLocaleDateString("en-GB");

        // Send the CSV file as response
        res.setHeader('Content-Disposition', `attachment; filename=forecast_output_${generationDate}.csv`);
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/agora', async (req, res) => {
    const apiKey = req.query.apikey;
    if (!apiKey) {
        return res.status(400).send('API key is required');
    }

    try {
        const weatherResponse = await axios.get('https://api.hgbrasil.com/weather', {
                params: { key: apiKey }
            });
        const data = weatherResponse.data.results;

        ;

        const condition_slug = data.condition_slug;
        const moon_phase = data.moon_phase;
        const current_date = data.date;
        const temp = data.temp;
        const city_name = data.city_name;
        const humidity = data.humidity;
        const description = data.description;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cartão do Tempo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f0f0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .weather-card {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    max-width: 350px;
                    text-align: center;
                }
                .weather-icon, .moon-icon {
                    width: 50px;
                }
                .title {
                    font-size: 1.5em;
                    margin-bottom: 10px;
                    color: #333;
                }
                .data {
                    font-size: 1.2em;
                    margin: 5px 0;
                }
                .icon-description {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .icon-description img {
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="weather-card">
                <h2 class="title">Tempo Atual em ${city_name}</h2>
                <div class="icon-description">
                    <img class="weather-icon" src="https://assets.hgbrasil.com/weather/icons/conditions/${condition_slug}.svg" alt="ícone de condição">
                    <p class="data">${description}</p>
                </div>
                <p class="data">Temperatura: ${temp}°C</p>
                <p class="data">Umidade: ${humidity}%</p>
                <div class="icon-description">
                    <img class="moon-icon" src="https://assets.hgbrasil.com/weather/icons/moon/${moon_phase}.png" alt="ícone de fase da lua">
                    <p class="data">${moonPhases[moon_phase] || ''}</p>
                </div>
                <p class="data">Data: ${current_date}</p>
            </div>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching weather data');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
