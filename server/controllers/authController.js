import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail, sendWelcomeEmail, sendSignupOTPToCompany } from "../utils/emailService.js";
import { generateOTP, generateOTPExpiry, isOTPExpired } from "../utils/otpHelper.js";
import { notifyAdminWorkflowEvent } from "../utils/adminWorkflowAlerts.js";

const generateToken = (id) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || "30d";
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
  // Decode to get the exact expiry timestamp
  const decoded = jwt.decode(token);
  return { token, expiresAt: decoded.exp * 1000 }; // ms epoch
};

// Comprehensive email validation
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Trim and convert to lowercase
  email = email.trim().toLowerCase();
  
  // Check length
  if (email.length > 254 || email.length < 5) return false;
  
  // More comprehensive email regex (RFC 5322 Official Standard)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Local part validation
  if (localPart.length > 64 || localPart.length === 0) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;
  
  // Domain validation
  if (domain.length === 0 || domain.startsWith('-') || domain.endsWith('-')) return false;
  if (domain.includes('..')) return false;
  if (!domain.includes('.')) return false;
  
  // Check for valid TLD (at least 2 characters)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  
  return true;
};

// Sanitize email
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const normalizeLocation = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();

const parseAddressForValidation = (address = "") => {
  if (!address || typeof address !== "string") return null;

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) return null;

  const zipSource = parts[parts.length - 1] || "";
  const zipMatch = zipSource.match(/(\d{6})/);
  if (!zipMatch) return null;

  const zipCode = zipMatch[1];
  const state = parts[parts.length - 2] || "";
  const city = parts[parts.length - 3] || "";

  if (!state || !city) return null;

  return { city, state, zipCode };
};

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const isValidPassword = (password) => {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain at least one uppercase letter" };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain at least one lowercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least one number" };
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return { valid: false, message: "Password must contain at least one special character" };
  return { valid: true };
};

export const join = async (req, res) => {
  console.log('Join request received:', req.body);
  let { name, email, password, role } = req.body;
  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password" });
    }

    // Sanitize email
    email = sanitizeEmail(email);
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address. Ensure it has a valid format (e.g., user@example.com)" });
    }

    // Validate password strength
    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      // If user exists but not verified, allow resending OTP
      if (!userExists.emailVerified) {
        const otp = generateOTP();
        userExists.emailVerificationToken = otp;
        userExists.emailVerificationExpires = generateOTPExpiry();
        await userExists.save();
        
        const emailResult = await sendOTPEmail(email, name, otp);
        if (!emailResult.success) {
          console.error('Failed to resend OTP email:', emailResult.error);
          return res.status(500).json({ 
            message: emailResult.error?.includes('Invalid login') || emailResult.error?.includes('authentication') 
              ? "Email service configuration error. Please contact support." 
              : "Failed to send verification email. Please check your email address and try again."
          });
        }

        // Best-effort company copy (does not block user flow)
        await sendSignupOTPToCompany({
          userName: userExists.name || name,
          userEmail: email,
          userRole: userExists.role,
          otp,
        });
        
        return res.status(200).json({ 
          message: "User already exists but not verified. New OTP sent to email.",
          requiresVerification: true,
          email: email
        });
      }
      return res.status(400).json({ message: "User already exists and is verified. Please login." });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Create user with OTP
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role,
      emailVerified: false,
      emailVerificationToken: otp,
      emailVerificationExpires: generateOTPExpiry()
    });
    
    // Send OTP email
    const emailResult = await sendOTPEmail(email, name, otp);
    if (!emailResult.success) {
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ 
        message: emailResult.error?.includes('Invalid login') || emailResult.error?.includes('authentication') 
          ? "Email service configuration error. Please contact support." 
          : "Failed to send verification email. Please check your email address and try again."
      });
    }

    // Best-effort company copy (does not block signup)
    await sendSignupOTPToCompany({
      userName: name,
      userEmail: email,
      userRole: role,
      otp,
    });
    
    console.log('User created successfully, OTP sent:', user._id);
    res.status(201).json({
      message: "Account created successfully. Please check your email for verification code.",
      requiresVerification: true,
      email: user.email
    });
  } catch (error) {
    console.error('Join error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  let { email, password, adminCode } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    email = sanitizeEmail(email);

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (user.role === "admin") {
        const requiredAdminCode = String(process.env.ADMIN_PANEL_CODE || "24062004").trim();
        if (String(adminCode || "").trim() !== requiredAdminCode) {
          return res.status(403).json({ message: "Invalid admin access code" });
        }
      }

      if (!user.sid) {
        await user.save();
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in. Check your inbox for the verification code.",
          requiresVerification: true,
          email: user.email
        });
      }

      // Check admin approval for investors
      if (user.role === "investor" && user.approvalStatus === "pending") {
        return res.status(403).json({
          message: "Your account is pending admin approval. You will be notified once approved.",
          pendingApproval: true,
        });
      }
      if (user.role === "investor" && user.approvalStatus === "rejected") {
        return res.status(403).json({
          message: user.approvalNote
            ? `Your account has been rejected: ${user.approvalNote}. Please contact support.`
            : "Your investor account has been rejected. Please contact support.",
          rejected: true,
        });
      }
      
      const { token, expiresAt } = generateToken(user._id);
      res.json({
        _id: user._id,
        sid: user.sid,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        approvalNote: user.approvalNote,
        profileImage: user.profileImage || user.profilePicture || "",
        token,
        expiresAt,
      });
    } else {
      // Provide clearer guidance when the entered email is pending verification.
      const pendingUser = await User.findOne({ pendingEmail: email }).select("email pendingEmail");
      if (pendingUser) {
        return res.status(403).json({
          message: `This email is pending verification. Please verify it first or login with your current email (${pendingUser.email}).`,
          pendingEmail: pendingUser.pendingEmail,
          currentEmail: pendingUser.email,
          requiresVerification: true,
        });
      }

      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP and complete registration
export const verifyOTP = async (req, res) => {
  let { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Please provide email and OTP" });
    }

    // Sanitize email
    email = sanitizeEmail(email);
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified. Please login." });
    }

    if (!user.emailVerificationToken) {
      return res.status(400).json({ message: "No verification code found. Please request a new one." });
    }

    // Check if OTP is expired
    if (isOTPExpired(user.emailVerificationExpires)) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // Check if OTP matches
    if (user.emailVerificationToken !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    // Investors require admin approval — set pending status
    if (user.role === "investor") {
      user.approvalStatus = "pending";
    }

    await user.save();

    if (user.role === "investor") {
      await notifyAdminWorkflowEvent({
        title: "Investor Profile Approval Request",
        section: "pending-investors",
        actorId: user._id,
        message: `Investor profile request received from ${user.name} (${user.email}).`,
        metadata: {
          investorId: user._id,
          investorEmail: user.email,
          status: "pending",
        },
      });
    }

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Investors cannot sign in from login until approved, but they should
    // still receive a session here to complete onboarding steps.
    if (user.role === "investor") {
      const { token, expiresAt } = generateToken(user._id);
      return res.json({
        message: "Email verified successfully! Complete your onboarding while your account is under admin review.",
        pendingApproval: true,
        email: user.email,
        role: user.role,
        _id: user._id,
        name: user.name,
        approvalStatus: user.approvalStatus,
        approvalNote: user.approvalNote,
        token,
        expiresAt,
      });
    }

    // Generate token and log user in
    const { token, expiresAt } = generateToken(user._id);
    
    res.json({
      message: "Email verified successfully!",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  let { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Please provide email" });
    }

    // Sanitize email
    email = sanitizeEmail(email);
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified. Please login." });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = generateOTPExpiry();
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, user.name, otp);
    if (!emailResult.success) {
      console.error('Failed to resend OTP email:', emailResult.error);
      return res.status(500).json({ 
        message: emailResult.error?.includes('Invalid login') || emailResult.error?.includes('authentication') 
          ? "Email service configuration error. Please contact support." 
          : "Failed to send verification email. Please check your email address and try again."
      });
    }

    res.json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const validateSignupAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const parsed = parseAddressForValidation(address);

    if (!parsed) {
      return res.status(400).json({
        valid: false,
        message: "Enter address as: Street, City, State, ZIP (6-digit).",
      });
    }

    const { city, state, zipCode } = parsed;

    const response = await fetch(`https://api.postalpincode.in/pincode/${zipCode}`);
    const data = await response.json();

    const offices = Array.isArray(data) && data[0]?.PostOffice ? data[0].PostOffice : [];
    if (!offices.length) {
      return res.status(400).json({
        valid: false,
        message: "Invalid ZIP code. No matching postal records found.",
      });
    }

    const normalizedInputState = normalizeLocation(state);
    const normalizedInputCity = normalizeLocation(city);

    const stateMatches = offices.some((office) => normalizeLocation(office.State) === normalizedInputState);

    const cityMatches = offices.some((office) => {
      const candidates = [office.District, office.Name, office.Block, office.Division]
        .filter(Boolean)
        .map((value) => normalizeLocation(value));

      return candidates.some((candidate) =>
        candidate === normalizedInputCity ||
        candidate.includes(normalizedInputCity) ||
        normalizedInputCity.includes(candidate)
      );
    });

    if (!stateMatches) {
      return res.status(400).json({
        valid: false,
        message: "State does not match the entered ZIP code.",
      });
    }

    if (!cityMatches) {
      return res.status(400).json({
        valid: false,
        message: "City does not match the entered ZIP code.",
      });
    }

    return res.json({
      valid: true,
      message: "Address validated successfully.",
      normalized: {
        city,
        state,
        zipCode,
      },
    });
  } catch (error) {
    console.error("Address validation error:", error);
    return res.status(500).json({
      valid: false,
      message: "Unable to validate address right now. Please try again.",
    });
  }
};

// Validate token & return current user data (used on page refresh)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Extract expiry from the current token
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.decode(token);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      approvalNote: user.approvalNote,
      profileImage: user.profileImage || user.profilePicture || "",
      profilePicture: user.profilePicture,
      bio: user.bio,
      expiresAt: decoded.exp * 1000,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
