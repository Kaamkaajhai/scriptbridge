import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  // For development, use ethereal.email or Gmail
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPassword = (process.env.EMAIL_PASSWORD || '').trim();
  
  console.log('Email config - User:', emailUser ? 'Found' : 'Missing', 'Pass:', emailPassword ? 'Found' : 'Missing');
  
  if (!emailUser || !emailPassword) {
    console.error('Missing EMAIL_USER or EMAIL_PASSWORD in environment variables');
    console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('EMAIL')));
    throw new Error('EMAIL_USER and EMAIL_PASSWORD environment variables are required');
  }
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    // Production configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else {
    // Development fallback - use Gmail with enhanced settings
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
};

// Validate email configuration
const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
  }
};

// Send OTP email
export const sendOTPEmail = async (email, name, otp) => {
  try {
    // Validate email configuration
    validateEmailConfig();
    
    // Validate email format
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Invalid email address format');
    }
    
    console.log(`Sending OTP email to ${email}...`);
    const transporter = createTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    console.log('Email service verified successfully');

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: email,
      subject: 'Verify Your Email - ckript',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #1e3a5f; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #1e3a5f; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ckript!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up with ckript! To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't create an account with ckript, please ignore this email.</p>
              
              <p>Best regards,<br>The ckript Team</p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nThank you for signing up with ckript! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account with ckript, please ignore this email.\n\nBest regards,\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email to', email, ':', error.message, { code: error.code, command: error.command, response: error.response });
    
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Invalid credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to email server.';
    } else if (error.responseCode === 550) {
      errorMessage = 'Invalid recipient email address.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Send signup verification copy to company email
export const sendSignupOTPToCompany = async ({ userName, userEmail, userRole, otp }) => {
  try {
    validateEmailConfig();
    const companyEmail = (process.env.COMPANY_NOTIFICATION_EMAIL || "info.ckript@gmail.com").trim().toLowerCase();

    if (!companyEmail || !companyEmail.includes("@")) {
      return { success: false, error: "Invalid company notification email" };
    }

    console.log(`Sending signup OTP copy to company email ${companyEmail} for ${userEmail}...`);
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || "noreply@ckript.com"}>`,
      to: companyEmail,
      subject: `Signup Verification Code Copy - ${userEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>New Signup Verification Code (Copy)</h2>
          <p>A new user has signed up and a verification code was generated.</p>
          <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tr><td><strong>Name:</strong></td><td>${userName || "N/A"}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${userEmail}</td></tr>
            <tr><td><strong>Role:</strong></td><td>${userRole || "N/A"}</td></tr>
            <tr><td><strong>OTP Code:</strong></td><td><strong style="font-size: 18px; letter-spacing: 2px;">${otp}</strong></td></tr>
            <tr><td><strong>Generated At:</strong></td><td>${new Date().toISOString()}</td></tr>
          </table>
          <p style="margin-top: 16px; color: #666;">This is an automated internal copy from ckript.</p>
        </body>
        </html>
      `,
      text: `New signup verification code copy\nName: ${userName || "N/A"}\nEmail: ${userEmail}\nRole: ${userRole || "N/A"}\nOTP: ${otp}\nGenerated At: ${new Date().toISOString()}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Signup OTP copy sent to company email:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending signup OTP copy to company:", error.message);
    return { success: false, error: error.message };
  }
};

// Send email-change verification copy to company email
export const sendEmailChangeOTPToCompany = async ({ userName, currentEmail, newEmail, otp, trigger = "email_change" }) => {
  try {
    validateEmailConfig();
    const companyEmail = (process.env.COMPANY_NOTIFICATION_EMAIL || "info.ckript@gmail.com").trim().toLowerCase();

    if (!companyEmail || !companyEmail.includes("@")) {
      return { success: false, error: "Invalid company notification email" };
    }

    const safeCurrentEmail = (currentEmail || "N/A").trim();
    const safeNewEmail = (newEmail || "N/A").trim();

    console.log(`Sending email-change OTP copy to company email ${companyEmail} for ${safeCurrentEmail} -> ${safeNewEmail}...`);
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || "noreply@ckript.com"}>`,
      to: companyEmail,
      subject: `Email Change Verification Code Copy - ${safeCurrentEmail} -> ${safeNewEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Email Change Verification Code (Copy)</h2>
          <p>A user requested email verification for an email update.</p>
          <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tr><td><strong>Name:</strong></td><td>${userName || "N/A"}</td></tr>
            <tr><td><strong>Current Email:</strong></td><td>${safeCurrentEmail}</td></tr>
            <tr><td><strong>New Email:</strong></td><td>${safeNewEmail}</td></tr>
            <tr><td><strong>OTP Code:</strong></td><td><strong style="font-size: 18px; letter-spacing: 2px;">${otp}</strong></td></tr>
            <tr><td><strong>Trigger:</strong></td><td>${trigger}</td></tr>
            <tr><td><strong>Generated At:</strong></td><td>${new Date().toISOString()}</td></tr>
          </table>
          <p style="margin-top: 16px; color: #666;">This is an automated internal copy from ckript.</p>
        </body>
        </html>
      `,
      text: `Email change verification code copy\nName: ${userName || "N/A"}\nCurrent Email: ${safeCurrentEmail}\nNew Email: ${safeNewEmail}\nOTP: ${otp}\nTrigger: ${trigger}\nGenerated At: ${new Date().toISOString()}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email-change OTP copy sent to company email:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email-change OTP copy to company:", error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
  try {
    console.log(`Sending welcome email to ${email}...`);
    const transporter = createTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    console.log('Email service verified successfully');

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: email,
      subject: 'Welcome to ckript!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ckript!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Your email has been successfully verified! You're now part of the ckript community.</p>
              <p>Get started by:</p>
              <ul>
                <li>Completing your profile</li>
                <li>Uploading your first script</li>
                <li>Connecting with industry professionals</li>
              </ul>
              <p>We're excited to have you on board!</p>
              <p>Best regards,<br>The ckript Team</p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nYour email has been successfully verified! You're now part of the ckript community.\n\nWe're excited to have you on board!\n\nBest regards,\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    return { success: false, error: error.message };
  }
};

// Send investor account approval email
export const sendInvestorApprovalEmail = async (email, name) => {
  try {
    console.log(`Sending investor approval email to ${email}...`);
    const transporter = createTransporter();
    await transporter.verify();

    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/login`;

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: email,
      subject: '✅ Your Investor Account Has Been Approved — ckript',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 14px; font-weight: bold; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px; }
            .button { display: inline-block; background: #1e3a5f; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">🎉 You're Approved!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <div><span class="badge">✅ Account Approved</span></div>
              <p>Great news! Your investor account on <strong>ckript</strong> has been reviewed and <strong>approved</strong> by our admin team.</p>
              <p>You can now log in and start exploring investment opportunities in creative projects.</p>
              <div style="text-align:center">
                <a href="${loginUrl}" class="button">Log In to ckript</a>
              </div>
              <p style="color:#666;font-size:13px">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${loginUrl}" style="color:#1e3a5f">${loginUrl}</a></p>
              <p>Welcome aboard,<br/><strong>The ckript Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nGreat news! Your investor account on ckript has been approved.\n\nYou can now log in at: ${loginUrl}\n\nWelcome aboard,\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Investor approval email sent to:', email, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending investor approval email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send investor account rejection email with optional admin reason
export const sendInvestorRejectionEmail = async (email, name, reason) => {
  try {
    console.log(`Sending investor rejection email to ${email}...`);
    const transporter = createTransporter();
    await transporter.verify();

    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/login`;
    const safeReason = String(reason || "").trim();

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: email,
      subject: 'Update on Your Investor Profile Review — ckript',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; background: #fee2e2; color: #991b1b; font-size: 14px; font-weight: bold; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px; }
            .reason { background: #fff; border-left: 4px solid #dc2626; padding: 12px 14px; border-radius: 6px; margin: 12px 0; }
            .button { display: inline-block; background: #1e3a5f; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">Profile Review Update</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <div><span class="badge">Profile Not Approved</span></div>
              <p>Thank you for applying as an investor on <strong>ckript</strong>. After review, your profile was not approved at this time.</p>
              ${safeReason ? `<p><strong>Review reason:</strong></p><div class="reason">${safeReason}</div>` : ""}
              <p>You may update your profile details and contact our support team for guidance.</p>
              <div style="text-align:center">
                <a href="${loginUrl}" class="button">Open ckript Login</a>
              </div>
              <p style="color:#666;font-size:13px">Need help? Reach us at info.ckript@gmail.com</p>
              <p>Regards,<br/><strong>The ckript Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nYour investor profile was not approved at this time.${safeReason ? `\n\nReview reason: ${safeReason}` : ""}\n\nYou can contact support at info.ckript@gmail.com.\n\nLogin: ${loginUrl}\n\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Investor rejection email sent to:', email, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending investor rejection email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send purchase request email to writer
export const sendPurchaseRequestEmail = async (writerEmail, writerName, investorName, scriptTitle, amount) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/purchase-requests`;

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: writerEmail,
      subject: `💰 Purchase Request for "${scriptTitle}" — ckript`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 14px; font-weight: bold; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px; }
            .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .button { display: inline-block; background: #1e3a5f; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">📩 New Purchase Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${writerName}</strong>,</p>
              <div><span class="badge">💰 Purchase Request</span></div>
              <p><strong>${investorName}</strong> is interested in purchasing your script and has submitted a purchase request.</p>
              <div class="info-box">
                <p style="margin:0"><strong>Script:</strong> ${scriptTitle}</p>
                <p style="margin:4px 0 0"><strong>Offered Amount:</strong> ₹${amount}</p>
                <p style="margin:4px 0 0"><strong>Investor:</strong> ${investorName}</p>
              </div>
              <p>Log in to ckript to review this request and choose to <strong>approve</strong> or <strong>decline</strong> the sale.</p>
              <p>If you approve, the funds will be transferred to your wallet immediately.</p>
              <div style="text-align:center">
                <a href="${dashboardUrl}" class="button">Review Purchase Request</a>
              </div>
              <p style="color:#666;font-size:13px">If the button doesn't work, copy and paste this link:<br/><a href="${dashboardUrl}" style="color:#1e3a5f">${dashboardUrl}</a></p>
              <p>Best regards,<br/><strong>The ckript Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${writerName},\n\n${investorName} wants to purchase your script "${scriptTitle}" for ₹${amount}.\n\nLog in to review the request: ${dashboardUrl}\n\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending purchase request email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send purchase approved email to investor
export const sendPurchaseApprovedEmail = async (investorEmail, investorName, writerName, scriptTitle) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const scriptsUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/search`;

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: investorEmail,
      subject: `✅ Purchase Approved — "${scriptTitle}" — ckript`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 14px; font-weight: bold; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px; }
            .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .button { display: inline-block; background: #065f46; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">🎉 Purchase Approved!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${investorName}</strong>,</p>
              <div><span class="badge">✅ Approved</span></div>
              <p>Great news! <strong>${writerName}</strong> has approved your purchase request. You now have full access to the script.</p>
              <div class="info-box">
                <p style="margin:0"><strong>Script:</strong> ${scriptTitle}</p>
                <p style="margin:4px 0 0"><strong>Writer:</strong> ${writerName}</p>
                <p style="margin:4px 0 0"><strong>Status:</strong> Access Granted ✅</p>
              </div>
              <p>You can now view the complete synopsis, full content, and all script details on ckript.</p>
              <div style="text-align:center">
                <a href="${scriptsUrl}" class="button">View My Scripts</a>
              </div>
              <p>Congratulations on your acquisition,<br/><strong>The ckript Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${investorName},\n\n${writerName} has approved your purchase request for "${scriptTitle}". You now have full access.\n\nView scripts: ${scriptsUrl}\n\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending purchase approved email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send purchase rejected email to investor
export const sendPurchaseRejectedEmail = async (investorEmail, investorName, writerName, scriptTitle, note) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const searchUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/search`;

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || 'noreply@ckript.com'}>`,
      to: investorEmail,
      subject: `Purchase Request Declined — "${scriptTitle}" — ckript`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; background: #fee2e2; color: #991b1b; font-size: 14px; font-weight: bold; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px; }
            .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .note-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 12px 16px; margin: 12px 0; font-style: italic; color: #92400e; }
            .button { display: inline-block; background: #1e3a5f; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">Purchase Request Update</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${investorName}</strong>,</p>
              <div><span class="badge">Request Declined</span></div>
              <p>We're sorry to inform you that <strong>${writerName}</strong> has declined your purchase request for the following script.</p>
              <div class="info-box">
                <p style="margin:0"><strong>Script:</strong> ${scriptTitle}</p>
                <p style="margin:4px 0 0"><strong>Writer:</strong> ${writerName}</p>
                <p style="margin:4px 0 0"><strong>Status:</strong> Declined</p>
              </div>
              ${note ? `<p><strong>Writer's note:</strong></p><div class="note-box">${note}</div>` : ''}
              <p>Any funds that were reserved for this purchase have been <strong>returned to your wallet</strong>.</p>
              <p>Don't be discouraged — there are many other great scripts available on ckript!</p>
              <div style="text-align:center">
                <a href="${searchUrl}" class="button">Explore More Scripts</a>
              </div>
              <p>Best regards,<br/><strong>The ckript Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 ckript. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${investorName},\n\n${writerName} has declined your purchase request for "${scriptTitle}".\n${note ? `\nWriter's note: ${note}\n` : ''}\nYour reserved funds have been returned to your wallet.\n\nExplore more scripts: ${searchUrl}\n\nThe ckript Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending purchase rejected email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send admin workflow alert email to company mailbox
export const sendAdminWorkflowAlertEmail = async ({ title, section, message, metadata = {} }) => {
  try {
    validateEmailConfig();

    const transporter = createTransporter();
    await transporter.verify();

    const companyEmail = (process.env.COMPANY_NOTIFICATION_EMAIL || "info.ckript@gmail.com").trim().toLowerCase();
    if (!companyEmail || !companyEmail.includes("@")) {
      return { success: false, error: "Invalid company notification email" };
    }

    const safeTitle = String(title || "Admin Workflow Alert").trim();
    const safeSection = String(section || "admin").trim();
    const safeMessage = String(message || "A new admin workflow item was created.").trim();

    const rows = Object.entries(metadata || {})
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
      .map(([key, value]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;"><strong>${String(key)}</strong></td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${String(value)}</td></tr>`
      )
      .join("");

    const mailOptions = {
      from: `"ckript" <${process.env.EMAIL_USER || "noreply@ckript.com"}>`,
      to: companyEmail,
      subject: `[Admin Alert] ${safeTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <h2 style="margin:0 0 8px;">${safeTitle}</h2>
          <p style="margin:0 0 12px;"><strong>Section:</strong> ${safeSection}</p>
          <p style="margin:0 0 16px;">${safeMessage}</p>
          ${rows ? `<table style="border-collapse:collapse;border:1px solid #e5e7eb;">${rows}</table>` : ""}
          <p style="margin-top:16px;color:#6b7280;font-size:12px;">Generated at ${new Date().toISOString()}</p>
        </body>
        </html>
      `,
      text: `Title: ${safeTitle}\nSection: ${safeSection}\nMessage: ${safeMessage}\n${Object.entries(metadata || {}).map(([k, v]) => `${k}: ${v}`).join("\n")}`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending admin workflow alert email:", error.message);
    return { success: false, error: error.message };
  }
};
