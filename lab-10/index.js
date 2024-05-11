const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// In-memory user store (replace this with a database in production)
const users = [
    
];

const jwtSecret = 'TestDummy'; // This should be stored securely

// Custom middleware function to apply to all routes except those under /account/
const customMiddleware = (req, res, next) => {
    if (!req.path.startsWith('/account/')) {
        // Place any common logic or operations you want to execute for non-account routes here
        console.log(`Processing request for path: ${req.path}`);
    }
    next(); // Proceed to next middleware or route handler
};

// Apply customMiddleware to all routes
app.use(customMiddleware);

const authenticateJWT = (req, res, next) => {
    console.log("authenticateJWT middleware is running");
    const token = req.cookies['accessToken'];

    if (token == null) {
        console.log("Token was not supplied");
        // Redirect to login page, include the originally requested URL as a query parameter
        const returnUrl = encodeURIComponent(req.originalUrl);
        console.log("ReturnUrl is: ", returnUrl);
        console.log("Redirecting to login-page");
        return res.redirect(`/account/login-page?returnUrl=${returnUrl}`);
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        console.log("Verifying token...");
        if (err) {
            console.log("Jwt verify had an error:", err);
            const returnUrl = encodeURIComponent(req.originalUrl);
            return res.redirect(`/account/login-page?returnUrl=${returnUrl}`);
        }
        req.user = user;
        console.log("User verified!");

        // If verification succeeds, proceed to the next middleware or route handler
        next();
    });
};


// Route to serve login page
app.get('/account/login-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route to serve sign-up page
app.get('/account/sign-up-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Route: GET /home
app.get('/home', authenticateJWT, (req, res) => {
    res.send('Welcome to the home page!');
});

// Route: GET /about
app.get('/about', authenticateJWT, (req, res) => {
    res.send('Welcome to the about page!');
});

// Route: GET /contact
app.get('/contact', authenticateJWT, (req, res) => {
    res.send('Welcome to the contact page!');
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
app.get('/account/logout-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'logout.html'));
});

// Route: POST /account/logout
app.post('/account/logout', (req, res) => {
    res.clearCookie('accessToken', { path: '/' }); // Clear cookie from root path
    res.send('Logged out successfully.');
});

// Start the server 
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
