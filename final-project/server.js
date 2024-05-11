const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path'); // Import the path module
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

const authenticateJWT = (req, res, next) => {
    console.log("authenticateJWT middleware is running");
    const token = req.cookies['accessToken'];

    if (token == null) {
        console.log("Token was not supplied");
    }


    jwt.verify(token, jwtSecret, (err, user) => {
        console.log("Verifying token...");
        if (err) {
            console.log("Jwt verify had an error:", err);
            return res.send(`Could not verify JWT`);
        }
        req.user = user;
        console.log("User verified!");

        // If verification succeeds, proceed to the next middleware or route handler
        next();
    });
};
    
// Routes
app.get('/home', (req, res) => {
    res.status(200).send(`
        <html>
            <head>
                <title>Home</title>
                <style>
                    .container {
                        width: 80%;
                        margin: auto;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Welcome to the Homepage</h1>
                    <div>
                        <p>This webpage is designed to give fellow collectors a quick means of selecting and looking at
                           the market on eBay or elsewhere for a particular Pokémon product.</p>
                        <p>Log in or sign up in the top right corner, please.</p>
                    </div>
                    <div style="position: absolute; top: 10px; right: 10px;">
                        <a href="/account/login-page">Login</a>
                    </div>
                </div>
            </body>
        </html>
    `);
});
// In-memory user store (replace this with a database in production)
const users = [
    
];

const jwtSecret = 'TestDummy'; // This should be stored securely

// Route to serve login page
app.get('/account/login-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route to serve sign-up page
app.get('/account/signup-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Route: POST /account/login
app.post('/account/login', async (req, res) => {
    const { username, password, returnUrl } = req.body;

    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).send('Invalid username or password');
    }

    try {
        // Compare hashed password with bcrypt
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send('Invalid username or password');
        }

        // Generate JWT token
        const accessToken = jwt.sign({ username: user.username, id: user.id }, jwtSecret);

        // Set JWT token in a cookie (HttpOnly and Secure flags set)
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: false, sameSite: 'strict' });

        // Redirect to returnUrl or home page
        const redirectUrl = returnUrl || '/home'; // Default to '/home' if no returnUrl specified
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error comparing passwords:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route: POST /account/sign-up
app.post('/account/sign-up', async (req, res) => {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).send('Username already exists');
    }

    try {
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds

        // Add new user to the in-memory store with hashed password
        users.push({ id: users.length + 1, username, password: hashedPassword });

        // Send success response
        res.status(201).send(`User '${username}' registered successfully!`);
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route: GET /about
app.get('/about', authenticateJWT, (req, res) => {
    res.send('Welcome to the about page!');
});

// Route: GET /contact
app.get('/contact', authenticateJWT, (req, res) => {
    res.send('Welcome to the contact page!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/home`);
});
