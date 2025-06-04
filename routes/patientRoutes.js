const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

router.post("/update-profile", patientController.updateProfile);
router.post("/create-patient-record", patientController.createPatientRecord);
router.post("/book-appointment", patientController.bookAppointmentController);

module.exports = router;
