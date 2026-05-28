import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener_db', {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n⚠️  MongoDB Connection failed: ${error.message}`);
    console.warn('⚠️  MongoDB is offline. Dynamic Fallback: Using local JSON-based mock database!\n');
    process.env.USE_MOCK_DB = 'true';
    
    // Patch mongoose Types for mock fallback safety
    class MockObjectId {
      constructor(id) {
        this.id = id || Math.random().toString(36).substring(2, 15);
      }
      toString() {
        return this.id;
      }
    }
    mongoose.Types = mongoose.Types || {};
    mongoose.Types.ObjectId = MockObjectId;
  }
};

export default connectDB;
