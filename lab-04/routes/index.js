const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: './uploads/' });
const csvParser = require('csv-parser');

module.exports = (app) => {
    // Route to display patient information
    app.get('/patient', (req, res) => {
        const queryParams = req.query;

        // Assuming patient data is stored in a CSV file named patient-data.csv
        const filePath = path.join(__dirname, `../public/data/patient-data.csv`);

        const results = [];

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                let isMatch = true;

                // Check each query parameter against the corresponding data field
                Object.keys(queryParams).forEach(param => {
                    const queryValue = queryParams[param].toLowerCase();
                    const dataValue = data[param].toLowerCase();

                    if (dataValue !== queryValue) {
                        isMatch = false;
                    }
                });

                // If all query parameters match, push the data to the results array
                if (isMatch) {
                    results.push(data);
                }
            })
            .on('end', () => {
                if (results.length === 0) {
                    res.status(404).send('Patient not found');
                } else {
                    res.render('patient', { data: results });
                }
            });
    });

    // Route to display weather information
    app.get('/weather', (req, res) => {
        const { cityName, year } = req.query;
        // Assuming weather data is stored in a JSON file named weather-data.json
        const filePath = path.join(__dirname, `../public/data/weather-data.json`);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.status(404).send('Weather data not found');
                return;
            }
            const jsonData = JSON.parse(data);
            const cityData = jsonData[cityName];
            if (!cityData || !cityData[year]) {
                res.status(404).send('Weather data not found for the specified city and year');
                return;
            }
            res.render('weather', { city: cityName, year: year, weather: cityData[year] });
        });
    });

    // Route for home page
    app.get('/', (req, res) => {
        res.render('home');
    });
    // Route to display images
    app.get('/images', (req, res) => {
    const imageDir = path.join(__dirname, '../public/images');
    fs.readdir(imageDir, (err, files) => {
    if (err) throw err;
    res.render('images', { images: files });
    });
    });
// Route to display the form
app.get('/submit-form', (req, res) => {
    // Render the form.handlebars template
    res.render('form', { title: 'Form Page' });
});

// Process the form data submitted via POST
app.post('/submit-form', upload.none(), (req, res) => {
    const { patientID, age, gender, bmi, bloodPressure, cholesterol, diabetes, smoker, physicalActivity, heartDisease } = req.body;
    const patientData = `${patientID},${age},${gender},${bmi},${bloodPressure},${cholesterol},${diabetes},${smoker},${physicalActivity},${heartDisease}\n`;

    // Append the form data to patient-data.csv
    fs.appendFile(path.join(__dirname, '../public/data/patient-data.csv'), patientData, (err) => {
        if (err) {
            console.error('Error appending data to patient-data.csv:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        console.log('Data appended to patient-data.csv:', patientData);
        res.send('Form submitted successfully!');
    });
});
};
