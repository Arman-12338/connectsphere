import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || process.env.MONGODB_USER;
    if (!connString) {
      console.error('Error: MongoDB Connection URI is missing. Ensure MONGODB_URI or MONGODB_USER is set in environment variables.');
      process.exit(1);
    }
    
    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(connString, {
      dbName: 'connectsphere',
      family: 4 // Forces IPv4 DNS lookup to resolve connection issues
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
