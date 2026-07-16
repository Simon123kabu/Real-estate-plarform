require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const expireListingsJob = require('./jobs/expireListings.job');
const expireSubscriptionsJob = require('./jobs/expireSubscriptions.job');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Start background jobs
    expireListingsJob.start();
    expireSubscriptionsJob.start();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};
startServer();