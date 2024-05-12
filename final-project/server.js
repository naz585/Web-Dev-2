const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path'); // Import the path module
const exphbs = require('express-handlebars'); // Import express-handlebars
const port = 3000;

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Logging',
    password: 'postgres',
    port: 5432,
});


// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure Handlebars as the view engine
app.engine('hbs', exphbs.engine({ extname: 'hbs' }));
app.set('view engine', 'hbs');

// Define the path to the views directory
app.set('views', path.join(__dirname, 'views'));

// Helper function to check if user is authenticated
const isAuthenticated = (req) => {
    const token = req.cookies['accessToken'];
    if (!token) {
        return false;
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        return true;
    } catch (err) {
        return false;
    }
};

const authenticateJWT = (req, res, next) => {
    const token = req.cookies['accessToken'];

    if (!token) {
        return res.status(401).send('Unauthorized: Access token is missing');
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(401).send('Unauthorized: Invalid access token');
        }

        req.user = user; // Set the verified user object to req.user
        next(); // Proceed to the next middleware or route handler
    });
};

// Middleware to check if user is authenticated and redirect if logged in
const redirectToHomeIfLoggedIn = (req, res, next) => {
    const token = req.cookies['accessToken'];
    if (token && isAuthenticated(req)) {
        // User is logged in, redirect to home page
        res.redirect('/home');
    } else {
        // User is not logged in, proceed to render login page
        next();
    }
};

// Function to create the users table
async function createUsersTable() {
    const checkTableQuery = `
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'users'
        )
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(checkTableQuery);
        const tableExists = result.rows[0].exists;

        if (!tableExists) {
            const createTableQuery = `
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL
                )
            `;
            await client.query(createTableQuery);
            console.log('users table created successfully');
        } else {
            console.log('users table already exists, skipping creation');
        }

        client.release();
    } catch (error) {
        console.error('Error creating or checking users table:', error);
    }
}

// Function to create the my_games table
async function createMyGamesTable() {
    const checkTableQuery = `
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'my_games'
        )
    `;

    try {
        const client = await pool.connect();
        const result = await client.query(checkTableQuery);
        const tableExists = result.rows[0].exists;

        if (!tableExists) {
            const createTableQuery = `
                CREATE TABLE my_games (
                    id SERIAL PRIMARY KEY,
                    url VARCHAR(255) NOT NULL,
                    TypeofMerch VARCHAR(50) NOT NULL,
                    description TEXT
                )
            `;
            await client.query(createTableQuery);
            console.log('my_games table created successfully');
        } else {
            console.log('my_games table already exists, skipping creation');
        }

        client.release();
    } catch (error) {
        console.error('Error creating or checking my_games table:', error);
    }
}

// GET ROUTES HERE GET ROUTES HERE GET ROUTES HERE GET ROUTES HERE GET ROUTES HERE GET ROUTES HERE GET ROUTES HERE GET ROUTES HERE 
// Route to serve home page
app.get('/home', authenticateJWT, (req, res) => {
    const { username } = req.user; // Get username from the decoded token
    res.render('home', { isLoggedIn: true, username });
});

// In-memory user store (replace this with a database in production)
const users = [
    
];

const jwtSecret = 'TestDummy'; // This should be stored securely

// Route to serve login page
app.get('/account/login-page', redirectToHomeIfLoggedIn, (req, res) => {
    res.render('login');
});

// Route to serve sign-up page
app.get('/account/signup-page', (req, res) => {
    res.render('signup');
});

// Route: GET /about
app.get('/about', authenticateJWT, (req, res) => {
    res.send('Welcome to the about page!');
});

// Route: GET /contact
app.get('/contact', authenticateJWT, (req, res) => {
    res.send('Welcome to the contact page!');
});

// Route: GET /welcome 
app.get('/welcome', (req, res) => {
    res.render('home');
});

app.get('/games', authenticateJWT, async (req, res) => {
    try {
        const query = 'SELECT id, url, typeofmerch, description FROM pokemon_games';
        const result = await pool.query(query);

        console.log('Result rows:', result.rows); // Log the retrieved rows to check

        const rows = result.rows;
        res.render('games', { rows });
    } catch (err) {
        console.error('Error fetching data from database:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Route: GET /logout
app.get('/logout', (req, res) => {
    // Clear the accessToken cookie
    res.clearCookie('accessToken');
    res.redirect('/welcome'); // Redirect to home page after logout
});

// POST ROUTES POST ROUTES POST ROUTES POST ROUTES POST ROUTES POST ROUTES POST ROUTES POST ROUTES POST ROUTES POST ROUTES 

// Route: POST /account/login
app.post('/account/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query the database to find the user by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0]; // Get the first user (if exists) from the query result

        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        // Compare hashed password with bcrypt
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send('Invalid username or password');
        }

        // Generate JWT token
        const accessToken = jwt.sign({ username: user.username, id: user.id }, jwtSecret, { expiresIn: '10m' });

        // Set JWT token in a cookie (HttpOnly and Secure flags set)
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: false, sameSite: 'strict' });

        // Redirect to home page after successful login
        res.redirect('/home');
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route: POST /account/sign-up
app.post('/account/sign-up', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username already exists in the database
        const userExistsQuery = 'SELECT * FROM users WHERE username = $1';
        const existingUser = await pool.query(userExistsQuery, [username]);

        if (existingUser.rows.length > 0) {
            return res.status(400).send('Username already exists! Click <a href="/account/login-page">here</a> to login');
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const insertUserQuery = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';
        const newUser = await pool.query(insertUserQuery, [username, hashedPassword]);

        res.status(201).redirect('/account/login-page');
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route: POST /store-games
app.post('/store-games', async (req, res) => {
    const { gameIds } = req.body;

    try {
        // Check if gameIds is an array
        if (!Array.isArray(gameIds)) {
            throw new Error('Invalid gameIds format');
        }

        // Use gameIds array to insert selected games into my_games table
        const insertQuery = `
            INSERT INTO my_games (url, TypeofMerch, description)
            SELECT url, typeofmerch, description
            FROM pokemon_games
            WHERE id = ANY($1)
        `;
        await pool.query(insertQuery, [gameIds]);

        res.sendStatus(200); // Send success response
    } catch (error) {
        console.error('Error storing games:', error);
        res.sendStatus(500); // Send error response
    }
});

createUsersTable();
createMyGamesTable();
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/welcome`);
});
