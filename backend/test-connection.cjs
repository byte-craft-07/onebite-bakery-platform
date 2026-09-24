const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  console.error("❌ Error: No MONGODB_URI or MONGO_URI found in .env file.");
  process.exit(1);
}

const safeUri = uri.replace(/:([^:@]+)@/, ":****@");
console.log("--------------------------------------------------");
console.log("Testing connection to MongoDB Atlas...");
console.log("URI:", safeUri);
console.log("--------------------------------------------------");

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ SUCCESS! Connected to MongoDB Atlas successfully!");
    console.log("Database authentication passed.");
    return mongoose.disconnect();
  })
  .then(() => {
    console.log("Disconnected cleanly.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ CONNECTION FAILED:");
    console.error(error.message);
    if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
      console.error("\n👉 ROOT CAUSE: Database Username or Password does not match MongoDB Atlas!");
      console.error("Please check MongoDB Atlas -> Security -> Database Access.");
    }
    process.exit(1);
  });
