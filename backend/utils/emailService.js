import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || EMAIL_USER;

const isConfigured = 
  EMAIL_USER && 
  EMAIL_USER !== "your-email@gmail.com" && 
  EMAIL_PASS && 
  EMAIL_PASS !== "your-gmail-app-password";

let transporter = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn("⚠️ Nodemailer is NOT fully configured. Messages will only be saved in the database, and email notifications will be logged to console.");
}

/**
 * Send email notification to Admin when someone contacts.
 */
export const sendNotificationEmail = async (msg) => {
  const mailOptions = {
    from: isConfigured ? EMAIL_USER : "portfolio-contact@admin.com",
    to: RECEIVER_EMAIL,
    subject: `New Portfolio Message from ${msg.name}`,
    text: `You have received a new contact message.\n\nName: ${msg.name}\nEmail: ${msg.email}\nMessage:\n${msg.message}\n\nDate: ${new Date(msg.createdAt).toLocaleString()}`,
    attachments: (msg.attachments || []).map(att => ({
      filename: att.filename,
      path: att.path,
    })),
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email notification successfully sent to ${RECEIVER_EMAIL}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send nodemailer notification:", error);
      return false;
    }
  } else {
    console.log("📝 [MOCK EMAIL SENT TO ADMIN]:", mailOptions);
    return true;
  }
};

/**
 * Send email reply to user from Admin.
 */
export const sendReplyEmail = async (to, subject, body) => {
  const mailOptions = {
    from: isConfigured ? EMAIL_USER : "portfolio-admin@admin.com",
    to: to,
    subject: subject || "Reply from Portfolio Admin",
    text: body,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Reply email sent to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send reply email to ${to}:`, error);
      return false;
    }
  } else {
    console.log(`📝 [MOCK EMAIL SENT TO USER ${to}]:`, mailOptions);
    return true;
  }
};

/**
 * Send meeting confirmation email.
 */
export const sendMeetingEmail = async (meeting) => {
  const mailOptions = {
    from: isConfigured ? EMAIL_USER : "portfolio-meetings@admin.com",
    to: meeting.email,
    subject: `Meeting Confirmed: ${meeting.subject}`,
    text: `Hi ${meeting.name},\n\nYour meeting has been scheduled and confirmed.\n\nTopic: ${meeting.subject}\nDate: ${meeting.date}\nTime: ${meeting.time}\nGoogle Meet Link: ${meeting.meetLink}\n\nLooking forward to speaking with you!\n\nBest regards,\nAdmin`,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Meeting confirmation email sent to ${meeting.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send meeting email to ${meeting.email}:`, error);
      return false;
    }
  } else {
    console.log(`📝 [MOCK MEETING EMAIL SENT TO ${meeting.email}]:`, mailOptions);
    return true;
  }
};
