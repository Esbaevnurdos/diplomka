const express = require("express");
const router = express.Router();
const {
  getAvailableDoctorsController,
  updateDoctorStatusController,
} = require("../controllers/doctorController");

router.get("/doctors/available", getAvailableDoctorsController);

router.patch("/doctors/:id/status", updateDoctorStatusController);

module.exports = router;
