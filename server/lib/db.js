import mongoose from 'mongoose';

// MongoDB connection options for robustness
const mongoOptions = {
    serverSelectionTimeoutMS: 10000,  // 10s timeout for server selection
    socketTimeoutMS: 45000,           // 45s timeout for socket operations
    connectTimeoutMS: 10000,          // 10s timeout for initial connection
    retryWrites: true,
    w: 'majority',
};

function getEnvMongoUri() {
    const raw = process.env.MONGODB_URI || process.env.MONGO_URI || '';
    return raw.trim().replace(/^["']|["']$/g, '');
}

function resolveMongoUri() {
    const uri = getEnvMongoUri();
    if (!uri) {
        throw new Error('MONGODB_URI is not set in server/.env');
    }
    // Use URI as-is when it already includes a database (e.g. /chatapp)
    if (/@[^/]+\/[^/?]+/.test(uri)) return uri;
    const qIndex = uri.indexOf('?');
    const base = qIndex === -1 ? uri : uri.slice(0, qIndex);
    const query = qIndex === -1 ? '' : uri.slice(qIndex);
    return `${base.replace(/\/$/, '')}/chatapp${query}`;
}

// Function to connect to the MongoDB database
export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return;

    mongoose.connection.on('connected', () => console.log('Database Connected'));
    mongoose.connection.on('error', (err) => console.log('MongoDB connection error:', err.message));

    const uri = resolveMongoUri();
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, mongoOptions);
};



// import mongoose from "mongoose";

// // Function to connect MongoDB
// export const connectDB = async () => {
//     try {

//         await mongoose.connect(process.env.MONGODB_URI);

//         console.log("Database Connected");

//     } catch (error) {

//         console.log("MongoDB Connection Error:", error);

//         process.exit(1);
//     }
// };