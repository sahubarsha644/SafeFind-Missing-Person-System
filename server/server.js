require("dotenv").config();
const admin = require("./firebaseAdmin");
const express = require("express");

const cors = require("cors");

const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");

const jwt = require("jsonwebtoken");

const authMiddleware = require("./middleware/authMiddleware");

const adminMiddleware = require("./middleware/adminMiddleware");

const MissingPerson = require("./models/MissingPerson");

const Sighting = require("./models/Sighting");

const JWT_SECRET = process.env.JWT_SECRET;



const User = require("./models/User");



const app = express();



app.use(cors());

app.use(express.json());
console.log("Firebase Admin initialized successfully");
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

app.get("/", (req, res) => {

  res.json({

    message: "SafeFind backend is running",

  });

});



app.get("/api/test", (req, res) => {

  res.json({

    success: true,

    message: "SafeFind API is working",

  });

});



app.post("/api/auth/signup", async (req, res) => {
  try {
    console.log("SIGNUP REQUEST RECEIVED");

    const {
      fullName,
      email,
      phone,
      password,
      latitude,
      longitude,
    } = req.body;

    // Required fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password, and location are required",
      });
    }

    // Validate latitude
    if (
      typeof latitude !== "number" ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    // Validate longitude
    if (
      typeof longitude !== "number" ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "user",

      latitude,
      longitude,
      locationUpdatedAt: new Date(),

      notificationsEnabled: false,
      expoPushToken: null,
    });

    await newUser.save();

    console.log("New user registered in MongoDB:");
    console.log("Name:", newUser.fullName);
    console.log("Email:", newUser.email);
    console.log("Role:", newUser.role);
    console.log("Latitude:", newUser.latitude);
    console.log("Longitude:", newUser.longitude);

    res.status(201).json({
      success: true,
      message: "Account created successfully",

      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        latitude: newUser.latitude,
        longitude: newUser.longitude,
        notificationsEnabled:
          newUser.notificationsEnabled,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});



app.post("/api/auth/login", async (req, res) => {

  try {

    console.log("LOGIN REQUEST RECEIVED");



    const { email, password } = req.body;



    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message: "Email and password are required",

      });

    }



    const user = await User.findOne({

      email: email.toLowerCase(),

    });



    if (!user) {

      return res.status(401).json({

        success: false,

        message: "Invalid email or password",

      });

    }



    const passwordMatch = await bcrypt.compare(password, user.password);



    if (!passwordMatch) {

      return res.status(401).json({

        success: false,

        message: "Invalid email or password",

      });

    }

    const token = jwt.sign(

{

userId: user._id.toString(),

email: user.email,

},

JWT_SECRET,

{ expiresIn: "1d" }

);

    console.log("User logged in:");

    console.log("Email:", user.email);

    console.log("Role:", user.role);



    res.json({

  success: true,

  message: "Login successful",

  token: token,

  user: {

    id: user._id,

    fullName: user.fullName,

    email: user.email,

    phone: user.phone,

    role: user.role,

  },

});

  } catch (error) {

    console.error("Login error:", error);



    res.status(500).json({

      success: false,

      message: "Server error",

    });

  }

});

app.get("/api/auth/me", authMiddleware, async (req, res) => {

  try {

    const user = await User.findById(req.user.userId).select(

      "_id fullName email phone role"

    );



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }



    return res.json({

      success: true,

      user: {

        id: user._id.toString(),

        fullName: user.fullName,

        email: user.email,

        phone: user.phone,

        role: user.role,

      },

    });

  } catch (error) {

    console.error("Auth check error:", error.message);



    return res.status(500).json({

      success: false,

      message: "Server error",

    });

  }

});

app.post("/api/missing-persons", authMiddleware, async (req, res) => {

  try {

    const {
  fullName,
  age,
  gender,
  photoUrl,
  lastSeenArea,
  latitude,
  longitude,
  lastSeenDate,
  description,
} = req.body;

    const numericAge = Number(age);



    if (!fullName || !age || !lastSeenArea || !lastSeenDate) {

      return res.status(400).json({

        success: false,

        message: "Required missing-person details are missing",

      });

    }



    if (!Number.isInteger(numericAge) || numericAge <= 0) {

      return res.status(400).json({

        success: false,

        message: "Age must be a valid positive number",

      });

    }



    const missingPerson = new MissingPerson({
  fullName,
  age: numericAge,
  gender,
  photoUrl: photoUrl || null,
  lastSeenArea,
  latitude:
    latitude !== undefined ? latitude : null,
  longitude:
    longitude !== undefined ? longitude : null,
  lastSeenDate,
  description,
  reportedBy: req.user.userId,
  status: "pending",
  verificationStatus: "pending",
});
    await missingPerson.save();



    console.log("Missing person report created:");

    console.log("Name:", missingPerson.fullName);

    console.log("Reported by:", missingPerson.reportedBy);



    res.status(201).json({

      success: true,

      message: "Missing person report submitted for verification",

      report: {

        id: missingPerson._id,

        fullName: missingPerson.fullName,

        status: missingPerson.status,

        verificationStatus: missingPerson.verificationStatus,

      },

    });

  } catch (error) {

    console.error("Missing person report error:", error);



    res.status(500).json({

      success: false,

      message: "Server error",

    });

  }

});
app.post("/api/users/location", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location coordinates",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        latitude,
        longitude,
        locationUpdatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User location updated:");
    console.log("User:", user.email);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    res.json({
      success: true,
      message: "Location saved successfully",
    });
  } catch (error) {
    console.error("Save location error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save location",
    });
  }
});
app.post("/api/users/push-token", authMiddleware, async (req, res) => {
  try {
    const { expoPushToken, notificationsEnabled } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({
        message: "Expo push token is required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.expoPushToken = expoPushToken;
    user.notificationsEnabled = notificationsEnabled !== false;

    await user.save();

    res.json({
      message: "Push token saved successfully",
    });
  } catch (error) {
    console.error("Save push token error:", error);

    res.status(500).json({
      message: "Failed to save push token",
    });
  }
});

app.get("/api/missing-persons/my-reports", authMiddleware, async (req, res) => {

  try {

    const reports = await MissingPerson.find({

      reportedBy: req.user.userId,

    }).sort({ createdAt: -1 });



    res.json({

      success: true,

      reports,

    });

  } catch (error) {

    console.error("My reports error:", error);



    res.status(500).json({

      success: false,

      message: "Server error",

    });

  }

});



app.get("/api/missing-persons", async (req, res) => {

  try {

    const { search } = req.query;



    const filter = {

      verificationStatus: "approved",

    };



    if (search) {

      filter.fullName = {

        $regex: search,

        $options: "i",

      };

    }



    const reports = await MissingPerson.find(filter)

      .select(

  "fullName age gender photoUrl lastSeenArea lastSeenDate description status verificationStatus"

)

      .sort({ createdAt: -1 });



    res.json({

      success: true,

      reports,

    });

  } catch (error) {

    console.error("Find missing persons error:", error);



    res.status(500).json({

      success: false,

      message: "Server error",

    });

  }

});


// Get one specific verified missing-person report
app.get(
  "/api/missing-persons/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(
        "Fetching missing person report:",
        id
      );

      // Validate MongoDB ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID",
        });
      }

      // Find the specific active approved case
      const report = await MissingPerson.findOne({
        _id: id,
        verificationStatus: "approved",
        status: {
          $nin: ["found", "closed"],
        },
      }).select(
        "fullName age gender photoUrl lastSeenArea lastSeenDate description status verificationStatus latitude longitude"
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Missing person report not found",
        });
      }

      console.log(
        "Missing person report found:",
        report.fullName
      );

      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error(
        "Get missing person by ID error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load missing person report",
      });
    }
  }
);
app.get(

  "/api/admin/missing-persons/pending",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const reports = await MissingPerson.find({

        verificationStatus: "pending",

      })

        .populate("reportedBy", "fullName email phone")

        .sort({ createdAt: -1 });



      res.json({

        success: true,

        reports,

      });

    } catch (error) {

      console.error("Pending reports error:", error);



      res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);



app.patch(
  "/api/admin/missing-persons/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check MongoDB ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID",
        });
      }

      // Approve the pending report
      const report = await MissingPerson.findOneAndUpdate(
        {
          _id: id,
          verificationStatus: "pending",
        },
        {
          verificationStatus: "approved",
          status: "verified",
        },
        {
          new: true,
        }
      );

      // Report not found
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Pending report not found",
        });
      }

      console.log("Report approved:");
      console.log("Report ID:", report._id);
      console.log("Approved by:", req.user.userId);

      // ==========================================
      // SEND PUSH NOTIFICATION TO REPORT OWNER
      // ==========================================

      try {
        // Find the user who submitted the report
        const reportOwner = await User.findById(
          report.reportedBy
        ).select(
          "fullName expoPushToken notificationsEnabled"
        );

        if (!reportOwner) {
          console.log(
            "Report owner not found. Notification skipped."
          );
        } else if (
          !reportOwner.expoPushToken
        ) {
          console.log(
            "No Expo Push Token found for report owner."
          );
        } else if (
          reportOwner.notificationsEnabled !== true
        ) {
          console.log(
            "Notifications disabled for report owner."
          );
        } else {
          console.log(
            "Sending approval notification to:",
            reportOwner.fullName
          );

          const expoResponse = await fetch(
            "https://exp.host/--/api/v2/push/send",
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: reportOwner.expoPushToken,
                sound: "null",
                title: "Report Approved",
                body: `Your missing person report for ${report.fullName} has been approved.`,
                channelId: "safefind-alerts",
                data: {
                  type: "report_approved",
                  reportId: report._id.toString(),
                },
              }),
            }
          );

          const expoResult =
            await expoResponse.json();

          console.log(
            "Expo notification response:",
            expoResult
          );
        }
      } catch (notificationError) {
        // Notification failure should NOT
        // make report approval fail
        console.error(
          "Push notification error:",
          notificationError
        );
      }
            // --------------------------------------------------
      // Notify users within 5 km of the missing person
      // --------------------------------------------------

      try {
        const missingLat = report.latitude;
        const missingLng = report.longitude;

        if (
          typeof missingLat !== "number" ||
          typeof missingLng !== "number"
        ) {
          console.log(
            "Missing person location unavailable. Nearby notifications skipped."
          );
        } else {
          const allUsers = await User.find({
            _id: { $ne: report.reportedBy },
            expoPushToken: { $ne: null },
            notificationsEnabled: true,
            latitude: { $ne: null },
            longitude: { $ne: null },
          }).select(
            "fullName expoPushToken latitude longitude"
          );

          console.log(
            `Checking ${allUsers.length} users for nearby notification...`
          );

          for (const user of allUsers) {
            const distance = calculateDistanceKm(
              missingLat,
              missingLng,
              user.latitude,
              user.longitude
            );

            if (distance <= 5) {
              console.log(
                `Nearby user found: ${user.fullName} (${distance.toFixed(
                  2
                )} km)`
              );

              try {
                const nearbyResponse = await fetch(
                  "https://exp.host/--/api/v2/push/send",
                  {
                    method: "POST",
                    headers: {
                      Accept: "application/json",
                      "Accept-encoding": "gzip, deflate",
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      to: user.expoPushToken,
                      title: "Missing Person Alert",
                      body: `A missing person has been reported near you. If you see them, please submit a sighting.`,
                      channelId: "safefind-alerts",
                      data: {
                        type: "nearby_missing_person",
                        reportId: report._id.toString(),
                      },
                    }),
                  }
                );

                const nearbyResult =
                  await nearbyResponse.json();

                console.log(
                  `Nearby notification response for ${user.fullName}:`,
                  nearbyResult
                );
              } catch (userNotificationError) {
                console.error(
                  `Failed to notify ${user.fullName}:`,
                  userNotificationError
                );
              }
            }
          }
        }
      } catch (nearbyError) {
        console.error(
          "Nearby user notification error:",
          nearbyError
        );
      }
      // ==========================================
      // SEND SUCCESS RESPONSE
      // ==========================================

      res.json({
        success: true,
        message:
          "Report approved successfully",
        report: {
          id: report._id,
          verificationStatus:
            report.verificationStatus,
          status: report.status,
        },
      });
    } catch (error) {
      console.error(
        "Approve report error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


app.patch(

  "/api/admin/missing-persons/:id/reject",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const { id } = req.params;



      if (!mongoose.Types.ObjectId.isValid(id)) {

        return res.status(400).json({

          success: false,

          message: "Invalid report ID",

        });

      }



      const report = await MissingPerson.findOneAndUpdate(

        {

          _id: id,

          verificationStatus: "pending",

        },

        {

          verificationStatus: "rejected",

          status: "closed",

        },

        {

          new: true,

        }

      );



      if (!report) {

        return res.status(404).json({

          success: false,

          message: "Pending report not found",

        });

      }



      console.log("Report rejected:");

      console.log("Report ID:", report._id);

      console.log("Rejected by:", req.user.userId);



      res.json({

        success: true,

        message: "Report rejected",

        report: {

          id: report._id,

          verificationStatus: report.verificationStatus,

          status: report.status,

        },

      });

    } catch (error) {

      console.error("Reject report error:", error);



      res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);



app.post(

  "/api/sightings",

  authMiddleware,

  async (req, res) => {

    try {

      const {

        missingPersonId,

        location,

        latitude,

        longitude,

        date,

        description,

        photoUrl,

      } = req.body;



      // Required fields

      if (!missingPersonId || !location || !date) {

        return res.status(400).json({

          success: false,

          message:

            "Missing person, location, and date are required",

        });

      }



      // Validate missing-person ID

      if (!mongoose.Types.ObjectId.isValid(missingPersonId)) {

        return res.status(400).json({

          success: false,

          message: "Invalid missing-person ID",

        });

      }



      // Validate coordinates when provided

      if (

        latitude !== null &&

        latitude !== undefined &&

        (typeof latitude !== "number" ||

          latitude < -90 ||

          latitude > 90)

      ) {

        return res.status(400).json({

          success: false,

          message: "Invalid latitude",

        });

      }



      if (

        longitude !== null &&

        longitude !== undefined &&

        (typeof longitude !== "number" ||

          longitude < -180 ||

          longitude > 180)

      ) {

        return res.status(400).json({

          success: false,

          message: "Invalid longitude",

        });

      }



      // Only approved missing-person cases can receive sightings

      const missingPerson = await MissingPerson.findOne({

        _id: missingPersonId,

        verificationStatus: "approved",
        status: { $nin: ["found", "closed"] },

      });



      if (!missingPerson) {

        return res.status(404).json({

          success: false,

          message: "Approved missing-person case not found",

        });

      }



      const sighting = new Sighting({

        missingPersonId,

        reportedBy: req.user.userId,

        location,

        latitude:

          latitude !== undefined ? latitude : null,

        longitude:

          longitude !== undefined ? longitude : null,

        date,

        description,

        photoUrl: photoUrl || null,

        status: "pending",

      });



      await sighting.save();



      console.log("New sighting submitted:");

      console.log("Sighting ID:", sighting._id);

      console.log("Missing person ID:", sighting.missingPersonId);

      console.log("Reported by:", sighting.reportedBy);

      console.log("Latitude:", sighting.latitude);

      console.log("Longitude:", sighting.longitude);



      res.status(201).json({

        success: true,

        message: "Sighting submitted for review",

        sighting: {

          id: sighting._id,

          missingPersonId: sighting.missingPersonId,

          latitude: sighting.latitude,

          longitude: sighting.longitude,

          photoUrl: sighting.photoUrl,

          status: sighting.status,

        },

      });

    } catch (error) {

      console.error(

        "Sighting submission error:",

        error.message

      );



      res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);



app.get(

  "/api/admin/sightings/pending",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const sightings = await Sighting.find({

        status: "pending",

      })

        .populate(

          "missingPersonId",

          "fullName age gender lastSeenArea lastSeenDate"

        )

        .populate(

          "reportedBy",

          "fullName email phone"

        )

        .sort({ createdAt: -1 });



      res.json({

        success: true,

        sightings,

      });

    } catch (error) {

      console.error("Pending sightings error:", error);



      res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);



// Admin reviews a pending sighting

app.patch("/api/admin/sightings/:id/review", authMiddleware, adminMiddleware, async (req, res) => {

  try {

    const { id } = req.params;

    const { action } = req.body;



    // Check MongoDB ID

    if (!mongoose.Types.ObjectId.isValid(id)) {

      return res.status(400).json({

        success: false,

        message: "Invalid sighting ID"

      });

    }



    // Only allow these two review actions

    if (!["reviewed", "dismissed"].includes(action)) {

      return res.status(400).json({

        success: false,

        message: 'Action must be "reviewed" or "dismissed"'

      });

    }



    // Find only a pending sighting

    const sighting = await Sighting.findOne({

      _id: id,

      status: "pending"

    });



    if (!sighting) {

      return res.status(404).json({

        success: false,

        message: "Pending sighting not found"

      });

    }



    // Update review status

    sighting.status = action;

    await sighting.save();



    console.log(`Sighting ${id} marked as ${action}`);



    res.json({

      success: true,

      message: `Sighting marked as ${action}`,

      sighting

    });



  } catch (error) {

    console.error("Sighting review error:", error.message);



    res.status(500).json({

      success: false,

      message: "Server error"

    });

  }

});



// Get all verified missing-person reports

app.get(

  "/api/admin/missing-persons/verified",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const reports = await MissingPerson.find({

        verificationStatus: "approved",

      })

        .populate("reportedBy", "fullName email phone")

        .sort({ createdAt: -1 });



      res.json({

        success: true,

        reports,

      });

    } catch (error) {

      console.error("Verified reports error:", error.message);



      res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);



// Admin: get all sightings submitted for one verified missing-person case

app.get(

  "/api/admin/missing-persons/:id/sightings",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const { id } = req.params;



      if (!mongoose.Types.ObjectId.isValid(id)) {

        return res.status(400).json({

          success: false,

          message: "Invalid missing-person ID",

        });

      }



      const missingPerson = await MissingPerson.findOne({

        _id: id,

        verificationStatus: "approved",

      });



      if (!missingPerson) {

        return res.status(404).json({

          success: false,

          message: "Verified missing-person case not found",

        });

      }



      const sightings = await Sighting.find({

        missingPersonId: id,

      })

        .populate(

          "reportedBy",

          "fullName email phone"

        )

        .sort({ createdAt: -1 });



      return res.json({

        success: true,

        sightings,

      });

    } catch (error) {

      console.error(

        "Case sightings error:",

        error.message

      );



      return res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);





app.get(

  "/api/admin/stats",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const [

        totalCases,

        pendingCases,

        verifiedCases,

        doneCases,

        pendingSightings,

      ] = await Promise.all([

        MissingPerson.countDocuments({}),



        MissingPerson.countDocuments({

          verificationStatus: "pending",

        }),



        MissingPerson.countDocuments({

          verificationStatus: "approved",

          status: "verified",

        }),



        // Done = approved cases that were found or closed.

        // Rejected reports are not counted as done.

        MissingPerson.countDocuments({

          verificationStatus: "approved",

          status: { $in: ["found", "closed"] },

        }),



        Sighting.countDocuments({

          status: "pending",

        }),

      ]);



      return res.json({

        success: true,

        stats: {

          totalCases,

          pendingCases,

          verifiedCases,

          doneCases,

          pendingSightings,

        },

      });

    } catch (error) {

      console.error("Admin stats error:", error.message);



      return res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);

app.patch(

  "/api/admin/missing-persons/:id/status",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const { id } = req.params;

      const { status } = req.body;



      if (!mongoose.Types.ObjectId.isValid(id)) {

        return res.status(400).json({

          success: false,

          message: "Invalid missing-person ID",

        });

      }



      if (!["found", "closed"].includes(status)) {

        return res.status(400).json({

          success: false,

          message: 'Status must be "found" or "closed"',

        });

      }



      const report = await MissingPerson.findOne({

        _id: id,

        verificationStatus: "approved",

      });



      if (!report) {

        return res.status(404).json({

          success: false,

          message: "Verified case not found",

        });

      }



      // A case must be found before it can be closed.

      if (status === "closed" && report.status !== "found") {

        return res.status(400).json({

          success: false,

          message: "Mark the case as found before closing it",

        });

      }



      report.status = status;

      await report.save();



      return res.json({

        success: true,

        message:

          status === "found"

            ? "Case marked as found"

            : "Case closed successfully",

        report: {

          id: report._id,

          status: report.status,

          verificationStatus: report.verificationStatus,

        },

      });

    } catch (error) {

      console.error("Case status update error:", error.message);



      return res.status(500).json({

        success: false,

        message: "Server error",

      });

    }

  }

);

const PORT = 5000;



async function startServer() {

  try {

    await mongoose.connect(process.env.MONGO_URI);



    console.log("MongoDB connected successfully");



    app.listen(PORT ,"0.0.0.0", () => {

      console.log(`SafeFind server running on http://localhost:${PORT}`);

    });

  } catch (error) {

    console.error("MongoDB connection failed:", error.message);

  }

}



startServer();
