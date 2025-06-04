require("dotenv").config();
const { Pool } = require("pg");

// const isProduction = process.env.NODE_ENV === "production";

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully:", res.rows[0]);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
