// Configuration for different environments
const config = {
  development: {
    socketUrl: "http://localhost:3000",
    apiUrl: "http://localhost:3000/api",
    mongoUri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/watch-and-chat",
    awsRegion: process.env.AWS_REGION || "us-east-1",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    port: process.env.PORT || 3000,
  },
  production: {
    socketUrl: "https://your-production-server.com",
    apiUrl: "https://your-production-server.com/api",
    mongoUri: process.env.MONGODB_URI,
    awsRegion: process.env.AWS_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    port: process.env.PORT || 80,
  },
};

// Get the current environment
const env = process.env.NODE_ENV || "development";

// Export the configuration for the current environment
module.exports = config[env];
