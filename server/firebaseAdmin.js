
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentialsPath) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS is missing from server/.env"
  );
}

const serviceAccount = require(path.resolve(__dirname, credentialsPath));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

console.log("Firebase Admin initialized successfully");
