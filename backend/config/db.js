const mongoose = require("mongoose");

const connectDB = async () => {
    const primaryUri = process.env.MONGO_URI;
    const fallbackUri = "mongodb://127.0.0.1:27017/AIprep";
    const options = {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
    };

    try {
        if (!primaryUri) {
            throw new Error("MONGO_URI is not defined");
        }

        await mongoose.connect(primaryUri, options);
        console.log("MongoDB connected using primary URI");
        return;
    } catch (err) {
        console.warn("Primary MongoDB connection failed:", err.message);
        console.warn("Attempting local MongoDB fallback...");
    }

    try {
        await mongoose.connect(fallbackUri, options);
        console.log("MongoDB connected using local fallback URI");
    } catch (err) {
        console.error("Error connecting to MongoDB using fallback URI", err);
        process.exit(1);
    }
};

module.exports = connectDB;