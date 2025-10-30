// config/index.js
const mongoose = require('mongoose'); // Import mongoose here

const config = {
    // ... (rest of your config object remains the same) ...
    mongoURI: process.env.MONGODB_URI,
    apiSNACK: process.env.API_SNACK || '/api/s1',
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000, // Or 5000, depending on what you want the default to be
   adminAccessCode: process.env.ADMIN_ACCESS_CODE, // Make sure this line is here
};

// Database connection function
const connectDB = () => {
    mongoose.connect(config.mongoURI) // Removed useNewUrlParser and useUnifiedTopology
    .then(() => {
        console.log("Database connection is ready");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
        // process.exit(1);
    });
};

module.exports = { config, connectDB };