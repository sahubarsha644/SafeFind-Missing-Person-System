const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    latitude: {
  type: Number,
  required: true,
},

longitude: {
  type: Number,
  required: true,
},

locationUpdatedAt: {
  type: Date,
  default: Date.now,
},

expoPushToken: {
  type: String,
  default: null,
},

notificationsEnabled: {
  type: Boolean,
  default: false,
},
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
