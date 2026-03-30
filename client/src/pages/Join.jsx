import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import OTPVerification from "../components/OTPVerification";
import BrandLogo from "../components/BrandLogo";

const EMAIL_EXISTS_MSG = "User already exists";

// Comprehensive email validation
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Trim and convert to lowercase
  email = email.trim().toLowerCase();
  
  // Check length
  if (email.length > 254 || email.length < 5) return false;
  
  // More comprehensive email regex
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

// Password validation criteria
const validatePassword = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
};

const Join = () => {
  const { join, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: searchParams.get("role") || "creator",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setEmailError("");
    
    // Trim and sanitize email
    const sanitizedEmail = formData.email.trim().toLowerCase();
    
    // Validate email
    if (!isValidEmail(sanitizedEmail)) {
      setEmailError("Please enter a valid email address (e.g., user@example.com)");
      return;
    }
    
    // Validate password
    const passwordCheck = validatePassword(formData.password);
    if (!Object.values(passwordCheck).every(Boolean)) {
      setError("Password does not meet all requirements");
      return;
    }
    
    // Check password confirmation
    if (formData.password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    
    setSubmitting(true);

    try {
      const response = await join({
        ...formData,
        email: sanitizedEmail
      });
      
      // Check if OTP verification is required
      if (response?.requiresVerification) {
        setUserEmail(formData.email);
        setShowOTPVerification(true);
      } else if (response?.token) {
        // Direct login (shouldn't happen with new flow, but keeping for backwards compatibility)
        if (response.role === "investor") {
          navigate("/home");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.code === "ERR_NETWORK"
          ? "Unable to connect to server. Please make sure backend is running on http://localhost:5001"
          : "Join failed");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOTPSuccess = (userData) => {
    // Update auth context with user data
    setUser(userData);
    
    // Navigate based on role
    if (userData.role === "investor") {
      navigate("/home");
    } else {
      navigate("/dashboard");
    }
  };

  const handleBackToSignup = () => {
    setShowOTPVerification(false);
    setUserEmail("");
  };

  const isEmailExists = error === EMAIL_EXISTS_MSG;
  const passwordValidation = validatePassword(formData.password);
  const allPasswordReqsMet = Object.values(passwordValidation).every(Boolean);

  // Show OTP verification screen if needed
  if (showOTPVerification) {
    return (
      <OTPVerification 
        email={userEmail} 
        onSuccess={handleOTPSuccess} 
        onBack={handleBackToSignup}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#080e18]">
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-0 left-0 w-[480px] h-[480px] bg-white/[0.03] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[360px] h-[360px] bg-white/[0.02] rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Form panel */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 pt-8 pb-12">
          <div className="mb-5">
            <BrandLogo className="h-10 w-auto" />
          </div>
          <div className="flex items-center justify-center mb-0">
            <div className="w-20 h-20 bg-[#0d1520] border border-[#1a2433] rounded-xl flex items-center justify-center shadow-lg shadow-black/25">
              <BookOpen className="text-white" size={40} strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#7f8ea2] text-sm font-medium mb-6">Reader Onboarding</p>
        <div className="w-full max-w-[540px] bg-[#0d1520]/95 rounded-2xl shadow-2xl shadow-black/30 border border-[#1a2433] p-10 backdrop-blur-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Create your account</h2>
            <p className="text-[15px] text-[#7f8ea2] mt-1.5 font-medium">Get started with Ckript in seconds</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/25 text-red-300 rounded-xl text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              <span>
                {isEmailExists ? (
                  <>An account with this email already exists.{" "}
                    <Link to="/login" className="underline hover:no-underline text-white">Sign in instead →</Link>
                  </>
                ) : error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#8fa2b8] mb-2">Full name</label>
              <input type="text" placeholder="Your full name"
                className="w-full px-4 py-3 bg-[#0b121c] border border-[#243447] rounded-xl text-[15px] text-white placeholder-[#506074] outline-none focus:border-[#3f5d7a] focus:ring-2 focus:ring-[#3f5d7a]/20 transition-all duration-200"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#8fa2b8] mb-2">Email address</label>
              <input type="email" placeholder="you@example.com"
                className={`w-full px-4 py-3 bg-[#0b121c] border rounded-xl text-[15px] text-white placeholder-[#506074] outline-none focus:ring-2 transition-all duration-200 ${
                  emailError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                    : 'border-[#243447] focus:border-[#3f5d7a] focus:ring-[#3f5d7a]/20'
                }`}
                value={formData.email} 
                onChange={(e) => { 
                  setFormData({ ...formData, email: e.target.value }); 
                  setEmailError(""); 
                }} 
                onBlur={() => formData.email && !isValidEmail(formData.email) && setEmailError("Invalid email format")}
                required />
              {emailError && (
                <p className="mt-1.5 text-[12px] font-semibold text-red-300 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#8fa2b8] mb-2">Password</label>
              <input type="password" placeholder="Create a strong password"
                className="w-full px-4 py-3 bg-[#0b121c] border border-[#243447] rounded-xl text-[15px] text-white placeholder-[#506074] outline-none focus:border-[#3f5d7a] focus:ring-2 focus:ring-[#3f5d7a]/20 transition-all duration-200"
                value={formData.password} 
                onChange={(e) => { 
                  setFormData({ ...formData, password: e.target.value }); 
                  setPasswordMismatch(false); 
                  if (!showPasswordReqs) setShowPasswordReqs(true);
                }} 
                onFocus={() => setShowPasswordReqs(true)}
                required />
              {showPasswordReqs && (
                <div className="mt-2 p-3 bg-[#0a111b] rounded-lg border border-[#1f2b3c]">
                  <p className="text-[11px] font-semibold text-[#8fa2b8] mb-2">Password Requirements:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordValidation.length ? 'text-emerald-400' : 'text-[#6e7f95]'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={passwordValidation.length ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordValidation.uppercase ? 'text-emerald-400' : 'text-[#6e7f95]'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={passwordValidation.uppercase ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      One uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordValidation.lowercase ? 'text-emerald-400' : 'text-[#6e7f95]'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={passwordValidation.lowercase ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      One lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordValidation.number ? 'text-emerald-400' : 'text-[#6e7f95]'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={passwordValidation.number ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      One number (0-9)
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordValidation.special ? 'text-emerald-400' : 'text-[#6e7f95]'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={passwordValidation.special ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      One special character (!@#$%^&*)
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#8fa2b8] mb-2">Confirm password</label>
              <input type="password" placeholder="Re-enter your password"
                className={`w-full px-4 py-3 bg-[#0b121c] border rounded-xl text-[15px] text-white placeholder-[#506074] outline-none focus:ring-2 transition-all duration-200 ${
                  passwordMismatch
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                    : 'border-[#243447] focus:border-[#3f5d7a] focus:ring-[#3f5d7a]/20'
                }`}
                value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMismatch(false); }} required />
              {passwordMismatch && (
                <p className="mt-1.5 text-[12px] font-semibold text-red-300 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white text-[#08121d] rounded-xl text-[15px] font-bold hover:bg-slate-100 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="inline-block w-4 h-4 border-2 border-[#08121d]/30 border-t-[#08121d] rounded-full animate-spin" />
              )}
              {submitting ? "Creating account..." : "Create account"}
            </button>

            {submitting && (
              <p className="text-center text-[12px] text-[#6e7f95] font-medium">Checking details and creating your account...</p>
            )}
          </form>

          <p className="mt-8 text-center text-[14px] text-[#7f8ea2] font-medium">
            Already have an account? <Link to="/login" className="text-white font-semibold hover:text-slate-200 transition-colors">Sign in</Link>
          </p>
          <p className="mt-3 text-center">
            <Link to="/" className="text-[13px] text-[#6e7f95] hover:text-[#9baabf] font-medium transition-colors">&larr; Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Join;
