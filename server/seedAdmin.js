// Run with: node seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import User from "./models/User.js";

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const adminEmail = (process.env.ADMIN_EMAIL || "admin@ckript.com").trim().toLowerCase();
        const adminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();
        const adminName = process.env.ADMIN_NAME || "Admin";

        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            // Keep admin credentials aligned with server bootstrap defaults.
            existing.name = adminName;
            existing.role = "admin";
            existing.emailVerified = true;
            existing.password = adminPassword;
            await existing.save();
            console.log("Updated existing user to admin:", existing._id);
        } else {
            const admin = await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                role: "admin",
                emailVerified: true,
            });
            console.log("Admin user created:", admin._id);
        }

        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        await mongoose.disconnect();
        console.log("Done!");
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

seedAdmin();