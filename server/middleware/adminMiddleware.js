import { getAdminBranchAccessStatus } from "../utils/adminBranchAccess.js";

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const branchAccess = getAdminBranchAccessStatus();
    if (!branchAccess.allowed) {
        return res.status(403).json({
            message: branchAccess.message,
            currentBranch: branchAccess.currentBranch,
            allowedBranches: branchAccess.allowedBranches,
        });
    }

    next();
};

export default adminOnly;
