const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path'); // Import the path module
const exphbs = require('express-handlebars'); // Import express-handlebars
const port = 3000;

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

// Routes
app.get('/home', authenticateJWT, (req, res) => {
    const isLoggedIn = isAuthenticated(req);
    const username = isLoggedIn ? req.user.username : null;
    res.render('home', { isLoggedIn, username });
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

// Route: POST /account/login
app.post('/account/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).send('Invalid username or password');
    }

    try {
        // Compare hashed password with bcrypt
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send('Invalid username or password! Click <a href="/account/login-page">here</a> to return to the login page');
        }

        // Generate JWT token
        const accessToken = jwt.sign({ username: user.username, id: user.id }, jwtSecret);

        // Set JWT token in a cookie (HttpOnly and Secure flags set)
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: false, sameSite: 'strict' });

        // Redirect to home page after successful login
        res.redirect('/home');
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
        return res.status(400).send('Username already exists! Click <a href="/account/signup-page">here</a> to return to the signup page');
    }

    try {
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds

        // Add new user to the in-memory store with hashed password
        users.push({ id: users.length + 1, username, password: hashedPassword });

        // Send success response
        res.status(201).redirect('/account/login-page');
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

app.get('/welcome', (req, res) => {
    res.render('home');
});

// Route: GET /logout
app.get('/logout', (req, res) => {
    // Clear the accessToken cookie
    res.clearCookie('accessToken');
    res.redirect('/welcome'); // Redirect to home page after logout
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/welcome`);
});
