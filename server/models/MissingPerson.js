const mongoose = require("mongoose");

const missingPersonSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
      trim: true,
    },

    lastSeenArea: {
      type: String,
      required: true,
      trim: true,
    },

    lastSeenDate: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "found", "closed"],
      default: "pending",
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    photoUrl: {
  type: String,
  default: null,
},
latitude: {
  type: Number,
  default: null,
},

longitude: {
  type: Number,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

const MissingPerson = mongoose.model(
  "MissingPerson",
  missingPersonSchema
);

module.exports = MissingPerson;
