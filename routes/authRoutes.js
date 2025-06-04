const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const captchaController = require("../controllers/captchaController");

router.post("/register", authController.registerUser);
router.post("/request-otp", authController.requestOTP);
router.post("/set-password", authController.verifyAndSetPassword);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);
router.get("/captcha", captchaController.generateCaptcha);

router.post("/captcha/verify", captchaController.verifyCaptcha);

module.exports = router;
