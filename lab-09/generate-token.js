const jwt = require('jsonwebtoken');

// Function to generate a JWT
function generateJWT(payload, secretKey) {
    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: '1h' });
    return token;
}

// Main code to take payload and secret key from command line arguments
const args = process.argv.slice(2); // Skip the first two elements (node command and script filename)
console.log('Arguments:', args); // Debugging output: Log the command-line arguments
console.log(args.length)
// Check if the number of arguments is correct
if (args.length !== 2) {
    console.error('Usage: node generate-token.js <payload as JSON> <secret key>');
    process.exit(1); // Exit with error status
}

// Parse the first argument (payload) as JSON
let payload;
try {
    payload = JSON.parse(args[0]); // Updated: Parsing JSON payload from args[0]
} catch (error) {
    console.error('Invalid JSON payload:', args[0]);
    process.exit(1); // Exit with error status
}

// Retrieve the secret key from the second argument
const secretKey = args[1];

// Generate JWT using the payload and secret key
try {
    const token = generateJWT(payload, secretKey);
    console.log('Generated JWT:', token);
} catch (error) {
    console.error('Error generating JWT:', error.message);
    process.exit(1); // Exit with error status
}
