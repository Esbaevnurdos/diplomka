const db = require("../db/queries");
const bcrypt = require("bcryptjs");
// const sendOTPEmail = require("../utils/emailService");
const authController = require("../controllers/authController");

const createPatientRecord = async (req, res) => {
  try {
    const { userId, diagnosis, notes } = req.body;

    if (!userId || !diagnosis) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Received Data:", { userId, diagnosis, notes });

    const result = await db.createPatientRecord(userId, diagnosis, notes);

    res.json({
      success: true,
      message: "Record created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ error: "Server error during record creation" });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log("Received Data:", req.body);

    const { id, address, dateOfBirth } = req.body;

    if (!id || !address || !dateOfBirth) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await db.updateUserProfile(id, address, dateOfBirth);

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error during profile update" });
  }
};

const bookAppointmentController = async (req, res) => {
  const { patientId, doctorId, date, time, reason } = req.body;
  console.log("Received data:", { patientId, doctorId, date, time, reason });

  try {
    await db.bookAppointment(patientId, doctorId, date, time, reason);
    res.json({ success: true, message: "Appointment booked successfully" });
  } catch (err) {
    console.error("Error booking appointment:", err.message);
    res.status(500).json({ error: "Failed to book appointment" });
  }
};

module.exports = {
  updateProfile,
  createPatientRecord,
  bookAppointmentController,
};
