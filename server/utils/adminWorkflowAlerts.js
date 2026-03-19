import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendAdminWorkflowAlertEmail } from "./emailService.js";

const safeText = (value = "") => String(value || "").trim();

export const notifyAdminWorkflowEvent = async ({
  title,
  message,
  section,
  actorId,
  scriptId,
  metadata,
}) => {
  try {
    const cleanTitle = safeText(title);
    const cleanMessage = safeText(message);
    if (!cleanTitle || !cleanMessage) return;

    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (admins.length > 0) {
      const docs = admins.map((admin) => ({
        user: admin._id,
        type: "admin_alert",
        from: actorId || undefined,
        script: scriptId || undefined,
        message: cleanMessage,
      }));
      await Notification.insertMany(docs, { ordered: false });
    }

    await sendAdminWorkflowAlertEmail({
      title: cleanTitle,
      section: safeText(section) || "admin",
      message: cleanMessage,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("[AdminWorkflowAlert] Failed:", error.message);
  }
};
