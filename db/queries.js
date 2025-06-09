const db = require("./db");
const axios = require("axios");
const bcrypt = require("bcryptjs");

const findUserByEmail = async (email) => {
  return await db.query("SELECT * FROM users WHERE email = $1", [email]);
};

const findUserByPhoneNumber = async (phone) => {
  return await db.query("SELECT * FROM users WHERE phone = $1", [phone]);
};

const createUser = async (full_name, email, phone, otp, otpExpiry) => {
  return await db.query(
    `INSERT INTO users 
      (full_name, email, phone, password, otp_code, otp_expiry, is_verified, address, branch, status, role)
     VALUES ($1, $2, $3, NULL, $4, $5, false, NULL, NULL, NULL, NULL)
     RETURNING id, full_name, email, phone`,
    [full_name, email, phone, otp, otpExpiry]
  );
};

const findUserByEmailAndOTP = async (email, otp) => {
  return await db.query(
    `SELECT * FROM users WHERE email=$1 AND otp_code=$2 AND otp_expiry > NOW()`,
    [email, otp]
  );
};

const updateUserPassword = async (email, hashedPassword) => {
  return await db.query(
    `UPDATE users SET password = $1, is_verified = true WHERE email = $2`,
    [hashedPassword, email]
  );
};

const updateUserOTP = async (email, otp, otpExpiry) => {
  try {
    return await db.query(
      `INSERT INTO users (email, otp_code, otp_expiry)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET otp_code = $2, otp_expiry = $3`,
      [email, otp, otpExpiry]
    );
  } catch (error) {
    console.error("Error updating OTP:", error);
    throw new Error("Failed to update OTP");
  }
};

const createPatientRecord = async (userId, diagnosis, notes) => {
  const result = await db.query(
    `INSERT INTO patient_records (user_id, diagnosis, notes) 
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, diagnosis, notes]
  );
  return result;
};

const updateUserProfile = async (id, address, dateOfBirth) => {
  return db.query(
    `UPDATE users SET address = $1, date_of_birth = $2 WHERE id = $3`,
    [address, dateOfBirth, id]
  );
};

const bookAppointment = async (patientId, doctorId, date, time, reason) => {
  const query = `
    INSERT INTO appointments (patient_id, doctor_id, date, time, reason) 
    VALUES ($1, $2, $3, $4, $5);
  `;
  const values = [patientId, doctorId, date, time, reason];
  try {
    await db.query(query, values);
    console.log("Appointment booked successfully");
  } catch (err) {
    console.error("Error booking appointment:", err);
    throw err;
  }
};

const addUser = async (
  fullName,
  password,
  email,
  phone,
  address,
  branch,
  status,
  role
) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (
        full_name,
        email,
        phone,
        password,
        address,
        branch,
        status,
        role,
        is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, full_name, email, phone;
    `;

    const result = await db.query(insertQuery, [
      fullName,
      email,
      phone,
      hashedPassword,
      address,
      branch,
      status,
      role,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting user:", error);
    throw new Error("Failed to insert user into users table");
  }
};

const deleteUser = async (ids) => {
  const query = `
    DELETE FROM users
    WHERE id = ANY($1::int[])
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [ids]);
    return result.rowCount;
  } catch (error) {
    console.error("Error deleting users:", error.message);
    throw error;
  }
};

const getAllUsers = async () => {
  const query = `
    SELECT 
      id,
      full_name,
      email,
      phone,
      address,
      branch,
      status,
      role
    FROM users;
  `;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching users:", error.message);
    throw error;
  }
};

const getUserById = async (id) => {
  const query = `
    SELECT id, full_name, email, phone, address, branch, status, role 
    FROM users 
    WHERE id = $1
  `;
  try {
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching user by id:", error.message);
    throw error;
  }
};

const updateUser = async (
  id,
  fullName,
  email,
  phone,
  address,
  branch,
  status,
  role
) => {
  const query = `
    UPDATE users
    SET full_name = $2,
        email = $3,
        phone = $4,
        address = $5,
        branch = $6,
        status = $7,
        role = $8
    WHERE id = $1
    RETURNING id, full_name, email, phone, address, branch, status, role;
  `;
  const values = [id, fullName, email, phone, address, branch, status, role];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating user by id:", error.message);
    throw error;
  }
};

const getAvailableDoctors = async () => {
  const query = `
    SELECT id, full_name, phone, branch, status 
    FROM staff 
    WHERE role = 'врач' AND status = 'активный';
  `;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error getting available doctors:", error.message);
    throw error;
  }
};

const updateDoctorStatus = async (id, status) => {
  const query = `
    UPDATE staff 
    SET status = $1 
    WHERE id = $2 AND role = 'doctor' 
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating doctor status:", error.message);
    throw error;
  }
};

const createRole = async (roleName, permission = "basic") => {
  // Check for existing role first
  const checkQuery = `SELECT * FROM roles WHERE name = $1;`;
  const existing = await db.query(checkQuery, [roleName]);

  if (existing.rows.length > 0) {
    throw new Error("Role already exists");
  }

  const insertQuery = `
    INSERT INTO roles (name, permission)
    VALUES ($1, $2)
    RETURNING *;
  `;
  try {
    const result = await db.query(insertQuery, [roleName, permission]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating role:", error.message);
    throw error;
  }
};

const getAllRoles = async () => {
  const query = `SELECT * FROM roles;`;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("🔥 Full error while fetching roles:", error);
    throw error;
  }
};

const updateRole = async (id, newName, permission) => {
  const query = `
    UPDATE roles 
    SET name = $1, permission = $2
    WHERE id = $3
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [newName, permission, id]);
    return result.rows[0]; // undefined if no role updated
  } catch (error) {
    console.error("Error updating role:", error.message);
    throw error;
  }
};
const getRoleById = async (id) => {
  const query = `SELECT * FROM roles WHERE id = $1;`;
  try {
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching role by ID:", error.message);
    throw error;
  }
};

const deleteRole = async (ids) => {
  const query = `
    DELETE FROM roles
    WHERE id = ANY($1::int[])
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [ids]);
    return result.rowCount;
  } catch (error) {
    console.error("Error deleting roles:", error.message);
    throw error;
  }
};

const addPermission = async (name, description, code) => {
  const query = `
    INSERT INTO permissions (name, description, code) 
    VALUES ($1, $2, $3) 
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [name, description, code]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding permission:", error.message);
    throw error;
  }
};

const getAllPermissions = async () => {
  const query = `SELECT * FROM permissions;`;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching permissions:", error.message);
    throw error;
  }
};

const getPermissionById = async (id) => {
  const query = `SELECT * FROM permissions WHERE id = $1;`;
  try {
    const result = await db.query(query, [id]);
    return result.rows[0]; // returns undefined if not found
  } catch (error) {
    console.error("Error fetching permission by ID:", error.message);
    throw error;
  }
};

const updatePermission = async (id, newName, description, code) => {
  const query = `
    UPDATE permissions 
    SET name = $1, description = $2, code = $3 
    WHERE id = $4 
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [newName, description, code, id]);

    if (result.rows.length === 0) {
      throw new Error("Permission not found"); // for 404 handling
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating permission:", error.message);
    throw error; // will be caught in controller
  }
};

const deletePermission = async (ids) => {
  if (!Array.isArray(ids)) {
    ids = [ids];
  }

  const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(", ");
  const query = `DELETE FROM permissions WHERE id IN (${placeholders}) RETURNING *;`;

  try {
    const result = await db.query(query, ids);
    console.log(`Deleted ${result.rowCount} permission(s) successfully`);
    return result.rowCount;
  } catch (error) {
    console.error("Error deleting permissions:", error.message);
    throw error;
  }
};

const addBranch = async (
  name,
  address,
  email,
  phoneNumber,
  status = "Активный"
) => {
  const query = `
    INSERT INTO branches (name, address, email, phone_number, status) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [
      name,
      address,
      email,
      phoneNumber,
      status,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding branch:", error.message);
    throw error;
  }
};

const updateBranch = async (
  id,
  newName,
  address,
  email,
  phoneNumber,
  status
) => {
  const query = `
    UPDATE branches 
    SET name = $1, address = $2, email = $3, phone_number = $4, status = $5 
    WHERE id = $6 
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [
      newName,
      address,
      email,
      phoneNumber,
      status,
      id, // match by id now
    ]);

    if (result.rows.length === 0) {
      throw new Error("Branch not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating branch:", error.message);
    throw error;
  }
};

const getBranchById = async (id) => {
  const query = `SELECT * FROM branches WHERE id = $1;`;
  try {
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error("Branch not found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching branch by ID:", error.message);
    throw error;
  }
};

const getAllBranches = async () => {
  const query = `SELECT * FROM branches;`;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching branches:", error.message);
    throw error;
  }
};

const deleteBranch = async (ids) => {
  if (!Array.isArray(ids)) ids = [ids]; // Ensure it's an array

  const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(", ");
  const query = `DELETE FROM branches WHERE id IN (${placeholders}) RETURNING *;`;

  try {
    const result = await db.query(query, ids);
    return result.rows; // All deleted branches
  } catch (error) {
    console.error("Error deleting branches:", error.message);
    throw error;
  }
};

const addSpecialist = async (
  name,
  phoneNumber,
  iin,
  branch, // this is now the name string
  status = "Активный",
  specialistType = "Внешний"
) => {
  const query = `
    INSERT INTO specialists (name, phone_number, iin, branch, status, specialist_type) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [
      name,
      phoneNumber,
      iin,
      branch,
      status,
      specialistType,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding specialist:", error.message);
    throw error;
  }
};

const getAllSpecialists = async () => {
  const query = `
    SELECT * FROM specialists;
  `;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching specialists:", error);
    throw error;
  }
};

const updateSpecialist = async (
  id,
  newName,
  phoneNumber,
  iin,
  branch,
  status,
  specialistType
) => {
  const query = `
    UPDATE specialists
    SET name = $1, phone_number = $2, iin = $3, branch = $4, status = $5, specialist_type = $6
    WHERE id = $7
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      newName,
      phoneNumber,
      iin,
      branch,
      status,
      specialistType,
      id, // use id here
    ]);

    if (result.rows.length === 0) {
      throw new Error("Specialist not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating specialist:", error.message);
    throw error;
  }
};

const getSpecialistById = async (id) => {
  const query = `
    SELECT id, name, phone_number, iin, branch, status, specialist_type
    FROM specialists
    WHERE id = $1;
  `;

  try {
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching specialist by id:", error.message);
    throw error;
  }
};

const deleteSpecialist = async (ids) => {
  const query = `
    DELETE FROM specialists 
    WHERE id = ANY($1::int[]); -- Efficient bulk delete using ANY
  `;
  try {
    const result = await db.query(query, [ids]);
    return result.rowCount; // number of deleted rows
  } catch (error) {
    console.error("Error deleting specialists:", error.message);
    throw error;
  }
};

const addPatient = async (
  name,
  iin,
  phone,
  service,
  paymentType,
  appointmentDateTime,
  comment
) => {
  const query = `
    INSERT INTO patients (name, iin, phone, service, payment_type, appointment_date_time, comment)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [
      name,
      iin,
      phone,
      service,
      paymentType,
      appointmentDateTime,
      comment,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding patient:", error.message);
    throw error;
  }
};

const getAllPatients = async () => {
  const query = `
    SELECT * FROM patients
    ORDER BY appointment_date_time DESC;
  `;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching patients:", error);
    throw error;
  }
};

const getPatientById = async (id) => {
  const query = `SELECT * FROM patients WHERE id = $1;`;
  try {
    const result = await db.query(query, [id]);
    return result.rows[0]; // returns patient object or undefined
  } catch (error) {
    console.error("Error fetching patient by id:", error.message);
    throw error;
  }
};

const updatePatient = async (
  id,
  service,
  paymentType,
  appointmentDateTime,
  comment
) => {
  const query = `
    UPDATE patients 
    SET service = $1, payment_type = $2, appointment_date_time = $3, comment = $4
    WHERE id = $5
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [
      service,
      paymentType,
      appointmentDateTime,
      comment,
      id,
    ]);
    if (result.rows.length === 0) {
      throw new Error("Patient not found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error updating patient by id:", error.message);
    throw error;
  }
};

const deletePatient = async (ids) => {
  const query = `DELETE FROM patients WHERE id = ANY($1::int[]);`;
  try {
    await db.query(query, [ids]);
  } catch (error) {
    console.error("Error deleting patients:", error.message);
    throw error;
  }
};

const addAppointment = async (
  patient,
  specialist,
  service,
  appointmentDateTime,
  comment,
  status,
  paymentType
) => {
  const query = `
    INSERT INTO appointments (
      patient,
      specialist,
      service,
      appointment_date_time,
      comment,
      status,
      payment_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  try {
    const result = await db.query(query, [
      patient,
      specialist,
      service,
      appointmentDateTime,
      comment,
      status,
      paymentType,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding appointment:", error.message);
    throw error;
  }
};

const getAppointmentsReportByPeriod = async (period) => {
  let groupByDate;
  switch (period) {
    case "daily":
      groupByDate = "DATE(appointment_date_time)";
      break;
    case "weekly":
      groupByDate = "DATE_TRUNC('week', appointment_date_time)";
      break;
    case "monthly":
      groupByDate = "DATE_TRUNC('month', appointment_date_time)";
      break;
    case "yearly":
      groupByDate = "DATE_TRUNC('year', appointment_date_time)";
      break;
    default:
      throw new Error("Invalid period");
  }

  const query = `
    SELECT
      service,
      ${groupByDate} AS period,
      COUNT(*) AS visit_count
    FROM appointments
    GROUP BY service, period
    ORDER BY period DESC;
  `;

  const result = await db.query(query);

  // Group by service
  const grouped = {};
  for (const row of result.rows) {
    if (!grouped[row.service]) {
      grouped[row.service] = {
        service: row.service,
        report: [],
      };
    }

    grouped[row.service].report.push({
      period: row.period,
      visit_count: row.visit_count,
    });
  }

  return Object.values(grouped);
};

// Raw report by date range
const getAppointmentsReportByDateRange = async (start_date, end_date) => {
  const query = `
    SELECT
      patient,
      specialist,
      service,
      appointment_date_time,
      status
    FROM appointments
    WHERE appointment_date_time BETWEEN $1 AND $2
    ORDER BY appointment_date_time DESC;
  `;
  const result = await db.query(query, [start_date, end_date]);
  return result.rows;
};

const getAllAppointments = async () => {
  const query = `
    SELECT * FROM appointments
    ORDER BY appointment_date_time DESC;
  `;
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    throw error;
  }
};

const getAppointmentById = async (appointmentId) => {
  const query = `SELECT * FROM appointments WHERE id = $1;`; // use id column here
  try {
    const result = await db.query(query, [appointmentId]);
    return result.rows[0]; // returns one appointment or undefined
  } catch (error) {
    console.error("Error fetching appointment by ID:", error.message);
    throw error;
  }
};

const updateAppointment = async (
  appointmentId,
  specialist,
  service,
  appointmentDateTime,
  comment,
  status
) => {
  const query = `
    UPDATE appointments 
    SET specialist = $1, service = $2, appointment_date_time = $3, comment = $4, status = $5
    WHERE id = $6
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      specialist,
      service,
      appointmentDateTime,
      comment,
      status,
      appointmentId,
    ]);

    if (result.rows.length === 0) {
      throw new Error("Appointment not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating appointment by ID:", error.message);
    throw error;
  }
};

const deleteAppointment = async (ids) => {
  const query = `DELETE FROM appointments WHERE id = ANY($1::int[]);`;
  try {
    await db.query(query, [ids]);
  } catch (error) {
    console.error("Error deleting appointments:", error.message);
    throw error;
  }
};

const getAllReportAppointments = async () => {
  const query = `
    SELECT 
      a.id,
      a.appointment_date_time,
      p.name AS patient,
      s.name AS specialist_name,
      a.total_revenue,     -- adjust column name if different
      a.transactions_count -- adjust column name if different
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN specialists s ON a.specialist_id = s.id
    ORDER BY a.appointment_date_time DESC;
  `;

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching all appointments:", error.message);
    throw error;
  }
};

const addService = async (name, description, price, isAvailable) => {
  const query = `
    INSERT INTO services (name, description, price, is_available)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;
  const values = [name, description, price, isAvailable];
  const result = await db.query(query, values);
  return result.rows[0];
};

const updateService = async (id, newName, description, price, isAvailable) => {
  const query = `
    UPDATE services 
    SET name = $1, description = $2, price = $3, is_available = $4
    WHERE id = $5
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      newName,
      description,
      price,
      isAvailable,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new Error("Service not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating service:", error.message);
    throw error;
  }
};

const getServiceById = async (id) => {
  const query = `SELECT * FROM services WHERE id = $1;`;
  try {
    const result = await db.query(query, [id]);
    return result.rows[0]; // undefined if not found
  } catch (error) {
    console.error("Error fetching service:", error.message);
    throw error;
  }
};

const deleteService = async (names) => {
  const placeholders = names.map((_, i) => `$${i + 1}`).join(", ");
  const query = `DELETE FROM services WHERE name IN (${placeholders});`;

  try {
    await db.query(query, names);
  } catch (error) {
    console.error("Error deleting services:", error.message);
    throw error;
  }
};

const getAllServices = async () => {
  const result = await db.query(
    "SELECT * FROM services ORDER BY created_at DESC;"
  );
  return result.rows;
};

const addExpense = async (category, amount, description) => {
  const query = `
    INSERT INTO expenses (name, amount, description, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *;
  `;
  const values = [category, amount, description];
  const result = await db.query(query, values);
  return result.rows[0];
};

const getExpenses = async () => {
  const result = await db.query(
    `SELECT * FROM expenses ORDER BY created_at DESC`
  );
  return result.rows;
};

const getExpenseById = async (id) => {
  const query = `SELECT * FROM expenses WHERE id = $1;`;
  const result = await db.query(query, [id]);
  return result.rows[0]; // undefined if not found
};

const updateExpense = async (id, category, amount, description) => {
  const query = `
    UPDATE expenses
    SET name = $1, amount = $2, description = $3
    WHERE id = $4
    RETURNING *;
  `;
  const values = [category, amount, description, id];
  const result = await db.query(query, values);
  return result.rows[0]; // undefined if not found
};

const deleteExpense = async (ids) => {
  const query = `DELETE FROM expenses WHERE id = ANY($1) RETURNING *;`;
  const result = await db.query(query, [ids]);
  return result.rows; // array of deleted rows
};

const addExpenseCategory = async (name, description) => {
  const query = `
    INSERT INTO expense_categories (name, description)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [name, description];
  const result = await db.query(query, values);
  return result.rows[0];
};

const getExpenseCategories = async () => {
  const result = await db.query(
    `SELECT * FROM expense_categories ORDER BY created_at DESC`
  );
  return result.rows;
};

const updateExpenseCategory = async (id, name, description) => {
  const query = `
    UPDATE expense_categories
    SET name = $2, description = $3
    WHERE id = $1
    RETURNING *;
  `;
  const result = await db.query(query, [id, name, description]);
  return result.rows[0];
};

const getExpenseCategoryById = async (id) => {
  const query = `SELECT * FROM expense_categories WHERE id = $1;`;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const deleteExpenseCategory = async (ids) => {
  const query = `DELETE FROM expense_categories WHERE id = ANY($1) RETURNING *;`;
  const result = await db.query(query, [ids]);
  return result.rows; // return array of deleted categories
};

const getExpenseReport = async (query, values) => {
  return db.query(query, values);
};

const createTransaction = async ({
  name,
  patient,
  specialist,
  amount,
  payment_method,
  comment,
  service_names,
}) => {
  const insertTransactionQuery = `
    INSERT INTO transactions (name, patient, specialist, amount, payment_method, comment, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING name;
  `;
  const result = await db.query(insertTransactionQuery, [
    name,
    patient,
    specialist,
    amount,
    payment_method,
    comment,
  ]);
  const transactionName = result.rows[0].name;

  const insertLinks = `
    INSERT INTO transaction_services (transaction_name, service_name)
    VALUES ${service_names.map((_, i) => `($1, $${i + 2})`).join(", ")};
  `;
  await db.query(insertLinks, [transactionName, ...service_names]);

  return transactionName;
};

const getTransactions = async () => {
  const query = `
    SELECT * FROM transactions ORDER BY created_at DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

const getTransactionById = async (id) => {
  const query = `
    SELECT
      t.*,
      JSON_AGG(
        JSON_BUILD_OBJECT('id', s.id, 'title', s.title, 'price', s.price)
      ) AS services
    FROM transactions t
    LEFT JOIN transaction_services ts ON t.id = ts.transaction_id
    LEFT JOIN services s ON ts.service_id = s.id
    WHERE t.id = $1
    GROUP BY t.id;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateTransaction = async ({
  id,
  amount,
  payment_method,
  comment,
  service_ids,
}) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const updateTransactionQuery = `
      UPDATE transactions
      SET amount = $1, payment_method = $2, comment = $3
      WHERE id = $4
      RETURNING *;
    `;
    await client.query(updateTransactionQuery, [
      amount,
      payment_method,
      comment,
      id,
    ]);

    await client.query(
      `DELETE FROM transaction_services WHERE transaction_id = $1`,
      [id]
    );

    const insertServiceLinksQuery = `
      INSERT INTO transaction_services (transaction_id, service_id) VALUES ${service_ids
        .map((_, i) => `($1, $${i + 2})`)
        .join(", ")}
    `;
    await client.query(insertServiceLinksQuery, [id, ...service_ids]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteTransaction = async (id) => {
  const query = `DELETE FROM transactions WHERE id = $1 RETURNING *;`;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const getCashboxReport = async (start_date, end_date, period) => {
  let groupByDate;
  switch (period) {
    case "daily":
      groupByDate = "DATE(t.created_at)";
      break;
    case "weekly":
      groupByDate = "DATE_TRUNC('week', t.created_at)";
      break;
    case "monthly":
      groupByDate = "DATE_TRUNC('month', t.created_at)";
      break;
    case "yearly":
      groupByDate = "DATE_TRUNC('year', t.created_at)";
      break;
    default:
      throw new Error("Invalid period");
  }

  const query = `
    SELECT
      s.id AS service_id,
      s.title AS service_title,
      ${groupByDate} AS period,
      SUM(t.amount) AS total_amount,
      COUNT(*) AS transaction_count
    FROM transactions t
    JOIN transaction_services ts ON t.id = ts.transaction_id
    JOIN services s ON ts.service_id = s.id
    WHERE t.created_at BETWEEN $1 AND $2
    GROUP BY s.id, s.title, period
    ORDER BY s.id, period;
  `;

  const result = await db.query(query, [start_date, end_date]);

  // Group rows by service_id
  const grouped = {};
  for (const row of result.rows) {
    if (!grouped[row.service_id]) {
      grouped[row.service_id] = {
        service_id: row.service_id,
        service_title: row.service_title,
        report: [],
      };
    }

    grouped[row.service_id].report.push({
      period: row.period,
      total_amount: row.total_amount,
      transaction_count: row.transaction_count,
    });
  }

  return Object.values(grouped);
};

// Get organization settings
const getOrganizationSettings = async () => {
  const query = `SELECT * FROM organization WHERE id = 1;`;
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching organization settings:", error.message);
    throw error;
  }
};

const updateOrganization = async (id, data) => {
  const { name, phone, bin_iin, address, director, description } = data;

  const query = `
    UPDATE organization
    SET
      name = $1,
      phone = $2,
      bin_iin = $3,
      address = $4,
      director = $5,
      description = $6
    WHERE id = $7
    RETURNING *;
  `;

  const values = [name, phone, bin_iin, address, director, description, id];

  const result = await db.query(query, values);

  if (result.rowCount === 0) {
    throw new Error("Organization not found");
  }

  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
  updateUserPassword,
  updateUserOTP,
  findUserByEmailAndOTP,
  findUserByPhoneNumber,
  createPatientRecord,
  updateUserProfile,
  bookAppointment,
  addUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
  getAvailableDoctors,
  updateDoctorStatus,
  createRole,
  getAllRoles,
  updateRole,
  deleteRole,
  getRoleById,
  addPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
  getPermissionById,
  addBranch,
  getAllBranches,
  updateBranch,
  deleteBranch,
  getBranchById,
  addSpecialist,
  getAllSpecialists,
  updateSpecialist,
  getSpecialistById,
  deleteSpecialist,
  addPatient,
  getAllPatients,
  updatePatient,
  deletePatient,
  getPatientById,
  addAppointment,
  deleteAppointment,
  updateAppointment,
  getAllAppointments,
  getAllReportAppointments,
  getAppointmentById,
  addService,
  deleteService,
  getAllServices,
  updateService,
  getServiceById,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  addExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategoryById,
  getOrganizationSettings,
  updateOrganization,
  getExpenseReport,
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getCashboxReport,
  getAppointmentsReportByDateRange,
  getAppointmentsReportByPeriod,
};
