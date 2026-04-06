import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function dropEmailIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    await collection.dropIndex('email_1');
    console.log('Successfully dropped email_1 index');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropEmailIndex();
