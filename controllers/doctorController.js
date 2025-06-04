const db = require("../db/queries");

const getAvailableDoctorsController = async (req, res) => {
  try {
    const doctors = await db.getAvailableDoctors();
    res.json({ success: true, doctors });
  } catch (error) {
    console.error("Error fetching available doctors:", error.message);
    res.status(500).json({ error: "Failed to get available doctors" });
  }
};

const updateDoctorStatusController = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["активный", "Не активный"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const updatedDoctor = await db.updateDoctorStatus(id, status);
    if (!updatedDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.json({ success: true, message: "Doctor status updated successfully" });
  } catch (error) {
    console.error("Error updating doctor status:", error.message);
    res.status(500).json({ error: "Failed to update doctor status" });
  }
};

module.exports = {
  getAvailableDoctorsController,
  updateDoctorStatusController,
};
