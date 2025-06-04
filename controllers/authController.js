const db = require("../db/queries");
const bcrypt = require("bcryptjs");
const sendOTPEmail = require("../utils/emailService");

const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;

    if (!full_name || !email || !phone) {
      return res
        .status(400)
        .json({ error: "Full name, email, and phone are required" });
    }

    const existingEmail = await db.findUserByEmail(email);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingPhone = await db.findUserByPhoneNumber(phone);
    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ error: "Phone number already in use" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    const newUser = await db.createUser(
      full_name,
      email,
      phone,
      otp,
      otpExpiry
    );

    await sendOTPEmail(email, otp);

    res.status(201).json({
      success: true,
      message: "User registered. OTP sent to email.",
      otp: otp,
      data: {
        id: newUser.rows[0].id,
        full_name: newUser.rows[0].full_name,
        email: newUser.rows[0].email,
        phone: newUser.rows[0].phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

const requestOTP = async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60000);

  await db.query(
    `INSERT INTO users (email, otp_code, otp_expiry) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) 
       DO UPDATE SET otp_code=$2, otp_expiry=$3`,
    [email, otp, otpExpiry]
  );

  await sendOTPEmail(email, otp);

  res.json({ success: true, message: "OTP sent to email" });
};

const verifyAndSetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await db.findUserByEmailAndOTP(email, otp);

    if (!user.rows.length) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.updateUserPassword(email, hashedPassword);

    res.json({
      success: true,
      message: "OTP verified and password set successfully",
    });
  } catch (error) {
    console.error("Error during OTP verification and password setting:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ error: "Phone number and password are required" });
    }

    console.log(`Logging in with phone number: ${phoneNumber}`);

    const user = await db.findUserByPhoneNumber(phoneNumber);
    if (!user.rows.length) {
      console.log(`User not found with phone number: ${phoneNumber}`);
      return res
        .status(400)
        .json({ error: "Invalid phone number or password" });
    }

    console.log("User found:", user.rows[0]);

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res
        .status(400)
        .json({ error: "Invalid phone number or password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.rows[0].id,
        fullname: user.rows[0].fullname,
        phoneNumber: user.rows[0].phone_number,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Server error during logout" });
    }
    res.clearCookie("connect.sid"); // or your session cookie name
    res.json({ success: true, message: "User logged out successfully" });
  });
};

module.exports = {
  registerUser,
  requestOTP,
  verifyAndSetPassword,
  loginUser,
  logoutUser,
};
