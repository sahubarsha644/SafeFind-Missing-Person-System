const admin = require("./firebaseAdmin");

const sendNotification = async (token, title, body, data = {}) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);

    console.log("Notification sent:", response);

    return response;
  } catch (error) {
    console.error("Notification error:", error.message);
    throw error;
  }
};

module.exports = {
  sendNotification,
};