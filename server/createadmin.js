const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing from .env");
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      {
        fullName: "SafeFind Administrator",
        email: adminEmail.toLowerCase(),
        phone: "0000000000",
        password: hashedPassword,
        role: "admin",
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Admin account is ready.");
    console.log("Admin email:", admin.email);
    console.log("Role:", admin.role);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exit(1);
  }
}

createAdmin();
