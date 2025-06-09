const db = require("../db/queries");
const axios = require("axios");
const multer = require("multer");
// const path = require("path");
// ... другие импорты

// Staff

const addUserController = async (req, res) => {
  try {
    const { fullName, password, email, phone, address, branch, status, role } =
      req.body;

    if (
      !fullName ||
      !password ||
      !email ||
      !phone ||
      !role ||
      !branch ||
      !status ||
      !address
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newUser = await db.addUser(
      fullName,
      password,
      email,
      phone,
      address,
      branch,
      status,
      role
    );

    res.status(201).json({
      success: true,
      message: "User added successfully",
      users: [newUser], // Wrap single object inside an array here
    });
  } catch (error) {
    console.error("Error adding user:", error.message);
    res.status(500).json({ error: "Server error during user creation" });
  }
};

const deleteUserController = async (req, res) => {
  try {
    let { ids } = req.body;

    // Normalize input: allow both number and array
    if (typeof ids === "number") {
      ids = [ids];
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ error: "ids must be a non-empty array of integers" });
    }

    const deletedCount = await db.deleteUser(ids);

    res.status(200).json({
      success: true,
      message: `${deletedCount} user(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting users:", error.message);
    res.status(500).json({ error: "Server error during user deletion" });
  }
};

const getAllUsersController = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.status(200).json(users); // Now returns just an array, not wrapped in { success: true, users: [...] }
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Server error while fetching users" });
  }
};

const getUserByIdController = async (req, res) => {
  const { id } = req.params; // use id now
  try {
    const user = await db.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json([user]);
  } catch (error) {
    console.error("Error fetching user by id:", error.message);
    res.status(500).json({ error: "Server error while fetching user" });
  }
};

const updateUserController = async (req, res) => {
  const { id } = req.params; // use id now
  const { fullName, email, phone, address, branch, status, role } = req.body;

  try {
    const updatedUser = await db.updateUser(
      id,
      fullName,
      email,
      phone,
      address,
      branch,
      status,
      role
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json([updatedUser]);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ error: "Server error during user update" });
  }
};

const createRoleController = async (req, res) => {
  const { roleName, permission } = req.body; // changed accessLevel to permission

  if (!roleName || roleName.length < 2) {
    return res
      .status(400)
      .json({ error: "Role name must contain at least 2 characters" });
  }

  try {
    const newRole = await db.createRole(roleName, permission);
    res.status(201).json([newRole]);
  } catch (error) {
    if (error.message === "Role already exists") {
      return res.status(409).json({ error: "Role already exists" }); // 409 = Conflict
    }

    console.error("Error creating role:", error.message);
    return res.status(500).json({ error: "Server error during role creation" });
  }
};

// Get All Roles
const getRolesController = async (req, res) => {
  try {
    const roles = await db.getAllRoles();
    res.status(200).json(roles); // Already an array from DB
  } catch (error) {
    console.error("Error fetching roles:", error.message);
    res.status(500).json([{ error: "Failed to fetch roles" }]);
  }
};

const updateRoleController = async (req, res) => {
  const { id } = req.params; // updating by role id
  const { roleName, permission } = req.body;

  if (!roleName || roleName.length < 2) {
    return res
      .status(400)
      .json({ error: "Role name must contain at least 2 characters" });
  }

  try {
    const updatedRole = await db.updateRole(id, roleName, permission);
    if (!updatedRole) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.status(200).json([updatedRole]);
  } catch (error) {
    console.error("Error updating role:", error.message);
    res.status(500).json({ error: "Server error during role update" });
  }
};

const deleteRoleController = async (req, res) => {
  let { ids } = req.body; // expecting one or more role IDs

  if (!ids) {
    return res.status(400).json({ error: "No role IDs provided" });
  }
  if (!Array.isArray(ids)) {
    ids = [ids];
  }

  try {
    const deletedCount = await db.deleteRole(ids);
    res.status(200).json([
      {
        success: true,
        message: `${deletedCount} role(s) deleted successfully`,
      },
    ]);
  } catch (error) {
    console.error("Error deleting roles:", error.message);
    res.status(500).json({ error: "Server error while deleting roles" });
  }
};

const getRoleByIdController = async (req, res) => {
  const { id } = req.params;
  try {
    const role = await db.getRoleById(id);

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.status(200).json([role]);
  } catch (error) {
    console.error("Error getting role by ID:", error.message);
    return res
      .status(500)
      .json([{ error: "Server error while fetching role" }]);
  }
};

const addPermission = async (req, res) => {
  const { name, description, code } = req.body;

  if (!name || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Name and code are required" });
  }

  try {
    const permission = await db.addPermission(name, description, code);
    res.status(201).json({ success: true, data: [permission] });
  } catch (error) {
    console.error("Error adding permission:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to add permission" });
  }
};

// Get All Permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await db.getAllPermissions();
    res.status(200).json(permissions); // <-- just send the array directly
  } catch (error) {
    console.error("Error fetching permissions:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch permissions" });
  }
};

const getPermissionById = async (req, res) => {
  const { id } = req.params;
  try {
    const permission = await db.getPermissionById(id);

    if (!permission) {
      return res.status(404).json([{ error: "Permission not found" }]);
    }

    res.status(200).json({ success: true, data: [permission] });
  } catch (error) {
    console.error("Error fetching permission by ID:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch permission" });
  }
};

const updatePermission = async (req, res) => {
  const { id } = req.params;
  const { newName, description, code } = req.body;

  try {
    const updatedPermission = await db.updatePermission(
      id,
      newName,
      description,
      code
    );

    res.status(200).json({ success: true, data: [updatedPermission] });
  } catch (error) {
    res.status(404).json([{ error: "Permission not found" }]);

    if (error.message === "Permission not found") {
      return res
        .status(404)
        .json({ success: false, message: "Permission not found" });
    }

    res
      .status(500)
      .json({ success: false, message: "Failed to update permission" });
  }
};

const deletePermission = async (req, res) => {
  let { ids } = req.body;

  if (!ids) {
    return res.status(400).json([{ error: "No permission IDs provided" }]);
  }

  if (!Array.isArray(ids)) {
    ids = [ids];
  }

  try {
    const deletedCount = await db.deletePermission(ids);
    res.status(200).json([
      {
        success: true,
        message: `${deletedCount} permission(s) deleted successfully`,
      },
    ]);
  } catch (error) {
    console.error("Error deleting permissions:", error.message);
    res.status(500).json([{ error: "Failed to delete permissions" }]);
  }
};

const addBranch = async (req, res) => {
  const { name, address, email, phoneNumber, status } = req.body;
  try {
    const branch = await db.addBranch(
      name,
      address,
      email,
      phoneNumber,
      status
    );
    res.status(201).json([branch]);
  } catch (error) {
    console.error("Error adding branch:", error.message);
    res.status(500).json([{ error: "Failed to add branch" }]);
  }
};

const updateBranch = async (req, res) => {
  const { id } = req.params; // changed from name to id
  const { newName, address, email, phoneNumber, status } = req.body;

  try {
    const updatedBranch = await db.updateBranch(
      id,
      newName,
      address,
      email,
      phoneNumber,
      status
    );
    res.status(200).json([updatedBranch]);
  } catch (error) {
    console.error("Error updating branch:", error.message);

    if (error.message === "Branch not found") {
      return res.status(404).json([{ error: "Branch not found" }]);
    }

    res.status(500).json([{ error: "Failed to update branch" }]);
  }
};

const getBranchById = async (req, res) => {
  const { id } = req.params; // changed from name to id
  try {
    const branch = await db.getBranchById(id);
    if (!branch) {
      return res.status(404).json([{ error: "Branch not found" }]);
    }
    res.status(200).json([branch]);
  } catch (error) {
    console.error("Error fetching branch by ID:", error.message);
    res.status(500).json([{ error: "Failed to fetch branch" }]);
  }
};

const getAllBranches = async (req, res) => {
  try {
    const branches = await db.getAllBranches();
    res.status(200).json(branches); // already an array
  } catch (error) {
    console.error("Error fetching branches:", error.message);
    res.status(500).json([{ error: "Failed to fetch branches" }]);
  }
};

const deleteBranch = async (req, res) => {
  let { ids } = req.body;

  if (!ids) {
    return res.status(400).json([{ error: "No branch IDs provided" }]);
  }

  if (!Array.isArray(ids)) {
    ids = [ids]; // Wrap in array if only one ID is sent
  }

  try {
    const deletedBranches = await db.deleteBranch(ids);
    if (deletedBranches.length === 0) {
      return res.status(404).json([{ error: "No branches found to delete" }]);
    }
    res.status(200).json([
      {
        message: `${deletedBranches.length} branch(es) deleted successfully`,
        deleted: deletedBranches,
      },
    ]);
  } catch (error) {
    console.error("Error deleting branches:", error.message);
    res.status(500).json([{ error: "Failed to delete branches" }]);
  }
};

const addSpecialist = async (req, res) => {
  const {
    name,
    phoneNumber,
    iin,
    branch,
    status = "Активный",
    specialistType = "Внешний",
  } = req.body;

  try {
    const specialist = await db.addSpecialist(
      name,
      phoneNumber,
      iin,
      branch,
      status,
      specialistType
    );
    res.status(201).json([specialist]);
  } catch (error) {
    console.error("Error adding specialist:", error.message);
    res.status(500).json([{ error: "Failed to add specialist" }]);
  }
};

// Get specialist by name
const getSpecialistById = async (req, res) => {
  const { id } = req.params; // changed from name to id

  try {
    const specialist = await db.getSpecialistById(id);
    if (!specialist) {
      return res.status(404).json([{ error: "Specialist not found" }]);
    }
    res.status(200).json([specialist]);
  } catch (error) {
    console.error("Error fetching specialist by id:", error.message);
    res.status(500).json({ error: "Failed to fetch specialist" });
  }
};

const getAllSpecialists = async (req, res) => {
  try {
    const specialists = await db.getAllSpecialists();
    res.status(200).json([
      {
        success: true,
        data: specialists,
      },
    ]);
  } catch (error) {
    console.error("Error fetching specialists:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch specialists" });
  }
};

const editSpecialist = async (req, res) => {
  const { id } = req.params; // changed from name to id
  const { newName, phoneNumber, iin, branch, status, specialistType } =
    req.body;

  try {
    const updatedSpecialist = await db.updateSpecialist(
      id,
      newName || undefined, // if newName is not provided, use undefined or keep existing in DB
      phoneNumber,
      iin,
      branch,
      status,
      specialistType
    );

    res.status(200).json([updatedSpecialist]);
  } catch (error) {
    if (error.message === "Specialist not found") {
      return res.status(404).json([{ error: "Specialist not found" }]);
    }
    console.error("Error updating specialist:", error.message);
    res.status(500).json({ error: "Failed to update specialist" });
  }
};

const deleteSpecialist = async (req, res) => {
  let { ids } = req.body;

  // Normalize to array
  if (typeof ids === "number" || typeof ids === "string") {
    ids = [parseInt(ids)];
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json([{ error: "Provide one or more specialist IDs to delete" }]);
  }

  try {
    const deletedCount = await db.deleteSpecialist(ids);
    res.status(200).json([
      {
        success: true,
        message: `${deletedCount} specialist(s) deleted successfully`,
      },
    ]);
  } catch (error) {
    console.error("Error deleting specialists:", error.message);
    res.status(500).json([{ error: "Failed to delete specialists" }]);
  }
};

const addPatient = async (req, res) => {
  const {
    name,
    service,
    paymentType = "Карта",
    appointmentDateTime,
    specialist,
    comment,
  } = req.body;

  try {
    const patient = await db.addPatient(
      name,
      service,
      paymentType,
      appointmentDateTime,
      specialist,
      comment
    );
    res.status(201).json([
      {
        success: true,
        data: [patient],
      },
    ]);
  } catch (error) {
    console.error("Error adding patient:", error.message);
    res.status(500).json({ success: false, message: "Failed to add patient" });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const patients = await db.getAllPatients();
    res.status(200).json([
      {
        success: true,
        data: patients,
      },
    ]);
  } catch (error) {
    console.error("Error fetching patients:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch patients" });
  }
};

const getPatientById = async (req, res) => {
  const { id } = req.params; // changed from name to id

  try {
    const patient = await db.getPatientById(id);

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.status(200).json([
      {
        success: true,
        data: [patient],
      },
    ]);
  } catch (error) {
    console.error("Error fetching patient by id:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch patient" });
  }
};

const updatePatient = async (req, res) => {
  const { id } = req.params; // changed from name to id
  const { service, paymentType, appointmentDateTime, specialist, comment } =
    req.body;

  try {
    const updatedPatient = await db.updatePatient(
      id,
      service,
      paymentType,
      appointmentDateTime,
      specialist,
      comment
    );

    res.status(200).json([
      {
        success: true,
        data: [updatedPatient],
      },
    ]);
  } catch (error) {
    console.error("Error updating patient by id:", error.message);
    if (error.message === "Patient not found") {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update patient" });
  }
};

const deletePatient = async (req, res) => {
  const { ids } = req.body; // expecting: { "ids": [1, 2, 3] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or empty 'ids' array" });
  }

  try {
    await db.deletePatient(ids);
    res.status(200).json([
      {
        success: true,
        message: `Deleted ${ids.length} patient(s) successfully`,
      },
    ]);
  } catch (error) {
    console.error("Error deleting patients:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete patients",
    });
  }
};

const addAppointment = async (req, res) => {
  const {
    patient,
    specialist,
    service,
    appointmentDateTime,
    comment,
    status = "Ожидает",
    paymentType, // New field
  } = req.body;

  try {
    const appointment = await db.addAppointment(
      patient,
      specialist,
      service,
      appointmentDateTime,
      comment,
      status,
      paymentType // Pass it to DB function
    );
    res.status(201).json([
      {
        success: true,
        data: [appointment],
      },
    ]);
  } catch (error) {
    console.error("Error adding appointment:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to add appointment" });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await db.getAllAppointments();
    res.status(200).json([
      {
        success: true,
        data: appointments,
      },
    ]);
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointments" });
  }
};

const getAppointmentById = async (req, res) => {
  const { id } = req.params; // appointment ID from URL

  try {
    const appointment = await db.getAppointmentById(id);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json([
      {
        success: true,
        data: [appointment],
      },
    ]);
  } catch (error) {
    console.error("Error fetching appointment:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointment" });
  }
};

const updateAppointment = async (req, res) => {
  const { id } = req.params; // appointment ID from URL
  const { specialist, service, appointmentDateTime, comment, status } =
    req.body;

  try {
    const updated = await db.updateAppointmentById(
      id,
      specialist,
      service,
      appointmentDateTime,
      comment,
      status
    );

    res.status(200).json([
      {
        success: true,
        data: [updated],
      },
    ]);
  } catch (error) {
    console.error("Error updating appointment:", error.message);

    if (error.message === "Appointment not found") {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res
      .status(500)
      .json({ success: false, message: "Failed to update appointment" });
  }
};

const deleteAppointment = async (req, res) => {
  const ids = req.body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide an array of appointment IDs to delete.",
    });
  }

  try {
    await db.deleteAppointment(ids);
    res.status(200).json([
      {
        success: true,
        message: "Appointments deleted successfully",
      },
    ]);
  } catch (error) {
    console.error("Error deleting appointments:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete appointments" });
  }
};

const getAllReportAppointments = async (req, res) => {
  try {
    const appointments = await db.getAllAppointments();
    res.status(200).json([
      {
        success: true,
        data: appointments,
      },
    ]);
  } catch (error) {
    console.error("Error in getAllAppointments:", error.message);
    res.status(500).json([
      {
        success: false,
        message: "Failed to fetch appointments",
      },
    ]);
  }
};

const getAppointmentsReportByDateRange = async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json([
      {
        success: false,
        message: "start_date and end_date query parameters are required",
      },
    ]);
  }

  try {
    const report = await db.getAppointmentsReportByDateRange(
      start_date,
      end_date
    );
    res.status(200).json([
      {
        success: true,
        data: report,
      },
    ]);
  } catch (error) {
    console.error("Error in getAppointmentsReportByDateRange:", error.message);
    res.status(500).json([
      {
        success: false,
        message: "Failed to fetch report",
      },
    ]);
  }
};

const getAppointmentsReportByPeriod = async (req, res) => {
  const { period } = req.params;

  const validPeriods = ["daily", "weekly", "monthly", "yearly"];
  if (!validPeriods.includes(period.toLowerCase())) {
    return res.status(400).json([
      {
        success: false,
        message: `Invalid period. Must be one of ${validPeriods.join(", ")}`,
      },
    ]);
  }

  try {
    const report = await db.getAppointmentsReportByPeriod(period.toLowerCase());
    res.status(200).json([
      {
        success: true,
        data: report,
      },
    ]);
  } catch (error) {
    console.error("Error in getAppointmentsReportByPeriod:", error.message);
    res.status(500).json([
      {
        success: false,
        message: "Failed to fetch report",
      },
    ]);
  }
};

const addService = async (req, res) => {
  const { name, description, price, isAvailable = true } = req.body;

  try {
    const service = await db.addService(name, description, price, isAvailable);
    res.status(201).json([{ success: true, data: service }]);
  } catch (error) {
    console.error("Error adding service:", error.message);
    res.status(500).json({ success: false, message: "Failed to add service" });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params; // using id now
  const { newName, description, price, isAvailable } = req.body;

  try {
    const updated = await db.updateService(
      id,
      newName,
      description,
      price,
      isAvailable
    );
    res.status(200).json([{ success: true, data: updated }]);
  } catch (error) {
    console.error("Error updating service:", error.message);
    if (error.message === "Service not found") {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update service" });
  }
};

const getServiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await db.getServiceById(id);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }
    res.status(200).json([{ success: true, data: service }]);
  } catch (error) {
    console.error("Error fetching service:", error.message);
    res.status(500).json({ success: false, message: "Failed to get service" });
  }
};

const deleteService = async (req, res) => {
  const { names } = req.body; // e.g., { names: ["Cleaning", "X-Ray"] }

  if (!Array.isArray(names) || names.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide a non-empty array of service names",
    });
  }

  try {
    await db.deleteService(names);
    res
      .status(200)
      .json([{ success: true, message: "Services deleted successfully" }]);
  } catch (error) {
    console.error("Error deleting services:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete services",
    });
  }
};

const getAllServices = async (_req, res) => {
  try {
    const services = await db.getAllServices();
    res.status(200).json([{ success: true, data: services }]);
  } catch (error) {
    console.error("Error fetching services:", error.message);
    res.status(500).json({ success: false, message: "Failed to get services" });
  }
};

const addExpense = async (req, res) => {
  const { category, amount, description } = req.body;

  try {
    const expense = await db.addExpense(category, amount, description);
    res.status(201).json([expense]);
  } catch (error) {
    console.error("Error adding expense:", error.message);
    res.status(500).json([{ error: "Failed to add expense" }]);
  }
};

const getExpenses = async (_req, res) => {
  try {
    const expenses = await db.getExpenses();
    res.status(200).json([{ success: true, data: expenses }]);
  } catch (error) {
    console.error("Error fetching expenses:", error.message);
    res.status(500).json([{ error: "Failed to get expenses" }]);
  }
};

const getExpenseById = async (req, res) => {
  const { id } = req.params; // use id now

  try {
    const expense = await db.getExpenseById(id);
    if (!expense) {
      return res.status(404).json([{ error: "Expense not found" }]);
    }
    res.status(200).json([expense]);
  } catch (error) {
    console.error("Error fetching expense by id:", error.message);
    res.status(500).json([{ error: "Failed to get expense" }]);
  }
};

const editExpense = async (req, res) => {
  const { id } = req.params; // use id now
  const { category, amount, description } = req.body;

  try {
    const expense = await db.updateExpense(id, category, amount, description);
    if (!expense) {
      return res.status(404).json([{ error: "Expense not found" }]);
    }
    res.status(200).json([expense]);
  } catch (error) {
    console.error("Error updating expense:", error.message);
    res.status(500).json([{ error: "Failed to update expense" }]);
  }
};

const deleteExpense = async (req, res) => {
  const { ids } = req.body; // Expecting an array of ids like [1, 2, 3]

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json([{ error: "Please provide an array of expense IDs to delete." }]);
  }

  try {
    const deletedExpenses = await db.deleteExpense(ids);
    if (deletedExpenses.length === 0) {
      return res.status(404).json([{ error: "No expenses found to delete." }]);
    }
    res
      .status(200)
      .json([{ success: true, message: "Expenses deleted", deletedExpenses }]);
  } catch (error) {
    console.error("Error deleting expenses:", error.message);
    res.status(500).json([{ error: "Failed to delete expenses" }]);
  }
};

const addExpenseCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    const category = await db.addExpenseCategory(name, description);
    res.status(201).json([category]); // returns an array
  } catch (error) {
    console.error("Error adding expense category:", error.message);
    res.status(500).json([{ error: "Failed to add category" }]); // also an array
  }
};

const getExpenseCategories = async (_req, res) => {
  try {
    const categories = await db.getExpenseCategories();
    res.status(200).json([{ success: true, data: categories }]); // wrapped in array
  } catch (error) {
    console.error("Error getting expense categories:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

const editExpenseCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await db.updateExpenseCategory(id, name, description);
    if (!category) {
      return res.status(404).json([{ error: "Category not found" }]);
    }
    res.status(200).json([category]);
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json([{ error: "Failed to update category" }]);
  }
};

const getExpenseCategoryById = async (req, res) => {
  const { id } = req.params; // changed from name to id

  try {
    const category = await db.getExpenseCategoryById(id);
    if (!category) {
      return res.status(404).json([{ error: "Category not found" }]);
    }
    res.status(200).json([category]);
  } catch (error) {
    console.error("Error fetching category by id:", error.message);
    res.status(500).json([{ error: "Failed to fetch category" }]);
  }
};

const deleteExpenseCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await db.deleteExpenseCategory(id);
    if (!category) {
      return res.status(404).json([{ error: "Category not found" }]);
    }
    res.status(200).json([{ message: "Category deleted", ...category }]);
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json([{ error: "Failed to delete category" }]);
  }
};

// GET /organization
const getOrganizationSettings = async (req, res) => {
  try {
    const settings = await db.getOrganizationSettings();
    res.status(200).json([{ success: true, data: settings }]);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization settings",
    });
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const updateOrganization = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await db.updateOrganization(id, req.body);
    res.status(200).json([
      {
        success: true,
        message: "Organization updated successfully",
        data: updated,
      },
    ]);
  } catch (err) {
    console.error("Update org error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const IMGBB_API_KEY = "98b825690cc3e1cca2484d46d23b65ef"; // Replace this with your real key

const updateOrganizationLogo = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No logo file uploaded" });
  }

  try {
    const base64Image = req.file.buffer.toString("base64");

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      new URLSearchParams({
        image: base64Image,
        name: `logo-${Date.now()}`,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const logoUrl = response.data.data.url;

    const query = `
      UPDATE organization
      SET logo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [logoUrl, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.status(200).json([
      {
        success: true,
        message: "Organization logo updated successfully",
        logo: logoUrl,
        data: result.rows[0],
      },
    ]);
  } catch (err) {
    console.error("Logo upload error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to upload logo" });
  }
};

//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No image file uploaded",
//       });
//     }

//     const base64Image = req.file.buffer.toString("base64");

//     const params = new URLSearchParams();
//     params.append("key", IMGBB_API_KEY);
//     params.append("image", base64Image);

//     const response = await axios.post(
//       "https://api.imgbb.com/1/upload",
//       params.toString(),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const logoUrl = response.data.data.url;

//     // Update logo_url only, other fields stay unchanged, so pass null for others
//     const updated = await db.updateOrganizationSettings({
//       name: null,
//       phone: null,
//       bin: null,
//       address: null,
//       director: null,
//       description: null,
//       logo_url: logoUrl,
//     });

//     res.status(200).json({ success: true, data: updated });
//   } catch (error) {
//     console.error("❌ Error updating org logo:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update organization logo",
//       error: error.message,
//     });
//   }
// };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getExpenseReportByPeriod = async (req, res) => {
  const { type } = req.params;
  const { start_date, end_date } = req.query;

  const validTypes = ["daily", "weekly", "monthly", "yearly"];
  if (!validTypes.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid type. Must be one of daily, weekly, monthly, yearly.",
    });
  }

  let groupBy;
  let dateFilter = "";
  let values = [];

  switch (type.toLowerCase()) {
    case "daily":
      groupBy = "TO_CHAR(created_at, 'YYYY-MM-DD')";
      break;
    case "weekly":
      groupBy = "TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD')";
      break;
    case "monthly":
      groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
      break;
    case "yearly":
      groupBy = "TO_CHAR(created_at, 'YYYY')";
      break;
  }

  // Apply optional date range filter if both dates provided
  if (start_date && end_date) {
    dateFilter = "WHERE created_at BETWEEN $1 AND $2";
    values = [start_date, end_date];
  }

  const query = `
    SELECT
      group_date,
      SUM(category_sum)::numeric AS total_expenses,
      JSON_OBJECT_AGG(category, category_sum) AS categories_summary
    FROM (
      SELECT
        ${groupBy} AS group_date,
        category,
        SUM(amount)::numeric AS category_sum
      FROM expenses
      ${dateFilter}
      GROUP BY ${groupBy}, category
    ) AS sub
    GROUP BY group_date
    ORDER BY group_date DESC;
  `;

  try {
    const result = await db.getExpenseReport(query, values);
    const data = result.rows.map((row, i) => ({
      id: `R${i + 1}`,
      created_at: row.group_date,
      totalExpenses: parseFloat(row.total_expenses),
      categoriesSummary: row.categories_summary,
    }));
    res.status(200).json([{ success: true, data }]);
  } catch (error) {
    console.error("❌ Report generation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

const getExpenseReportByDateRange = async (req, res) => {
  const { start_date, end_date } = req.params;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: "Missing start_date or end_date in URL params",
    });
  }

  const query = `
    SELECT
      created_at::date AS group_date,
      category,
      SUM(amount)::numeric AS category_sum
    FROM expenses
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY group_date, category
    ORDER BY group_date DESC;
  `;

  try {
    const result = await db.getExpenseReport(query, [start_date, end_date]);

    // aggregate by date into your desired structure
    const grouped = {};

    result.rows.forEach(({ group_date, category, category_sum }) => {
      if (!grouped[group_date])
        grouped[group_date] = { categoriesSummary: {}, totalExpenses: 0 };
      grouped[group_date].categoriesSummary[category] =
        parseFloat(category_sum);
      grouped[group_date].totalExpenses += parseFloat(category_sum);
    });

    const data = Object.entries(grouped).map(([date, obj], i) => ({
      id: `R${i + 1}`,
      created_at: date,
      totalExpenses: obj.totalExpenses,
      categoriesSummary: obj.categoriesSummary,
    }));

    res.status(200).json([{ success: true, data }]);
  } catch (error) {
    console.error("❌ Date range report generation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

const createCashboxTransaction = async (req, res) => {
  try {
    let { service_names, ...transactionData } = req.body;

    if (!Array.isArray(service_names)) {
      service_names = [service_names];
    }

    if (service_names.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service_name is required",
      });
    }

    // Generate a readable transaction name (you can change this logic)
    const name = `txn_${Date.now()}`;

    const transactionName = await db.createTransaction({
      ...transactionData,
      name,
      service_names,
    });

    res
      .status(201)
      .json([{ success: true, transaction_name: transactionName }]);
  } catch (error) {
    console.error("Error creating cashbox transaction:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to create transaction" });
  }
};

const getCashboxTransactions = async (req, res) => {
  try {
    const transactions = await db.getTransactions();
    res.status(200).json([{ success: true, data: transactions }]);
  } catch (error) {
    console.error("Error fetching cashbox transactions:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch transactions" });
  }
};

const getCashboxTransactionById = async (req, res) => {
  try {
    const transaction = await db.getTransactionById(req.params.id);
    res.status(200).json([{ success: true, data: transaction }]);
  } catch (error) {
    console.error(
      `Error fetching cashbox transaction by ID ${req.params.id}:`,
      error.message
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch transaction" });
  }
};

const updateCashboxTransaction = async (req, res) => {
  try {
    await db.updateTransaction({ id: req.params.id, ...req.body });
    res.status(200).json([{ success: true }]);
  } catch (error) {
    console.error(
      `Error updating cashbox transaction ${req.params.id}:`,
      error.message
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to update transaction" });
  }
};

const deleteCashboxTransactionById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteTransaction([id]);
    res.status(200).json([{ success: true }]);
  } catch (error) {
    console.error("Error deleting transaction:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete transaction" });
  }
};

const getCashboxReportByPeriod = async (req, res) => {
  try {
    let { start_date, end_date } = req.query;
    const period = req.params.type.toLowerCase();

    if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid period. Must be one of daily, weekly, monthly, yearly.",
      });
    }

    if (!start_date || !end_date) {
      const now = new Date();
      end_date = now.toISOString().slice(0, 10) + " 23:59:59";
      start_date =
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10) + " 00:00:00";
    } else {
      if (start_date.length === 10) start_date += " 00:00:00";
      if (end_date.length === 10) end_date += " 23:59:59";
    }

    const report = await db.getCashboxReport(start_date, end_date, period);
    res.status(200).json([{ success: true, data: report }]);
  } catch (error) {
    console.error("Error fetching cashbox report:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report" });
  }
};

const getCashboxReportByDateRange = async (req, res) => {
  const { start_date, end_date } = req.params;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ success: false, message: "Missing date range" });
  }

  try {
    const report = await db.getCashboxReport(
      start_date + " 00:00:00",
      end_date + " 23:59:59",
      "daily"
    );
    res.status(200).json([{ success: true, data: report }]);
  } catch (error) {
    console.error("Error fetching cashbox range report:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report" });
  }
};

module.exports = {
  addUserController,
  deleteUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  createRoleController,
  getRolesController,
  updateRoleController,
  deleteRoleController,
  getRoleByIdController,
  addBranch,
  getAllBranches,
  updateBranch,
  deleteBranch,
  getBranchById,
  addPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
  getPermissionById,
  addSpecialist,
  editSpecialist,
  getAllSpecialists,
  deleteSpecialist,
  getSpecialistById,
  deletePatient,
  getPatientById,
  addPatient,
  updatePatient,
  getAllPatients,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  getAllReportAppointments,
  getAppointmentsReportByDateRange,
  getAppointmentsReportByPeriod,
  getAppointmentById,
  getAllAppointments,
  addService,
  getAllServices,
  deleteService,
  getServiceById,
  updateService,
  addExpense,
  getExpenses,
  editExpense,
  getExpenseById,
  deleteExpense,
  addExpenseCategory,
  getExpenseCategories,
  editExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategoryById,
  getOrganizationSettings,
  updateOrganization,
  getExpenseReportByDateRange,
  getExpenseReportByPeriod,
  createCashboxTransaction,
  updateCashboxTransaction,
  deleteCashboxTransactionById,
  getCashboxTransactionById,
  getCashboxTransactions,
  getCashboxReportByPeriod,
  getCashboxReportByDateRange,
  updateOrganizationLogo,
};
