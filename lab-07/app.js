const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
app.use(express.static('public'));

// Configure PostgreSQL connection
const pool = new Pool({
    user: 'postgres', //derived from pgadmin credentials
    host: 'localhost', //derived from pgadmin credentials
    database: 'patient_db', //derived from pgadmin credentials
    password: 'postgres', //password for connecting to pgadmin 
    port: 5432, //derived from pgadmin
  });

// Middleware
app.use(bodyParser.json());

// Patients Routes
// Create
app.post('/patients', async (req, res) => {
  const { firstname, lastname, birthdate, smoker, gender } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Patients (firstname, lastname, birthdate, smoker, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [firstname, lastname, birthdate, smoker, gender]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Read
app.get('/patients', async (req, res) => {
    const { patientid } = req.query; // Extract patientid from query parameters

    try {
        if (patientid) {
            // If patientid is provided, retrieve specific patient
            const result = await pool.query('SELECT * FROM Patients WHERE patientid = $1', [patientid]);

            if (result.rows.length === 0) {
                res.status(404).json({ message: 'Patient not found' });
            } else {
                res.status(200).json(result.rows[0]);
            }
        } else {
            // If no patientid provided, retrieve all patients
            const result = await pool.query('SELECT * FROM Patients');
            res.status(200).json(result.rows);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

  // Update
  app.put('/patients/:id', async (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, birthdate, smoker, gender } = req.body;
    
    try {
      const result = await pool.query(
        'UPDATE Patients SET firstname = $1, lastname = $2, birthdate = $3, smoker = $4, gender = $5 WHERE patientID = $6 RETURNING *',
        [firstname, lastname, birthdate, smoker, gender, id]
      );
      res.status(200).json(result.rows[0]);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Delete
  app.delete('/patients/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM Patients WHERE patientID = $1', [id]);
      res.status(204).send();
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // MedicalLogs Routes
  // Create
  app.post('/medical-logs', async (req, res) => {
    const { patientID, date, title, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO MedicalLogs (patientID, date, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [patientID, date, title, description]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Read all logs for a patient
  app.get('/medical-logs/:patientID', async (req, res) => {
    const { patientID } = req.params;
    try {
      const result = await pool.query('SELECT * FROM MedicalLogs WHERE patientID = $1', [patientID]);
      res.status(200).json(result.rows);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Update
  app.put('/medical-logs/:patientID/:date/:title', async (req, res) => {
    const { patientID, date, title } = req.params;
    const { description } = req.body; // Assuming you might want to update the description
    try {
      const result = await pool.query(
        'UPDATE MedicalLogs SET description = $1 WHERE patientID = $2 AND date = $3 AND title = $4 RETURNING *',
        [description, patientID, date, title]
      );
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      } else {
        res.status(404).send('Medical log not found.');
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Delete
  app.delete('/medical-logs/:patientID/:date/:title', async (req, res) => {
    const { patientID, date, title } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM MedicalLogs WHERE patientID = $1 AND date = $2 AND title = $3',
        [patientID, date, title]
      );
      if (result.rowCount > 0) {
        res.status(204).send();
      } else {
        res.status(404).send('Medical log not found.');
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });  

app.get ('/intro', (req,res) => {
    res.json({message:"Hello!"})
});

app.listen(port, () => {
console.log(`Server running at http://localhost:${port}/`);
})