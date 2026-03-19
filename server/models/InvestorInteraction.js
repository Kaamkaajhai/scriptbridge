import mongoose from "mongoose";

const investorInteractionSchema = new mongoose.Schema(
  {
    investor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    script: { type: mongoose.Schema.Types.ObjectId, ref: "Script", required: true, index: true },
    type: {
      type: String,
      enum: ["view", "like", "save", "click", "time_spent", "read"],
      required: true,
      index: true,
    },
    timeSpentMs: { type: Number, default: 0 },
    source: { type: String, default: "unknown" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

investorInteractionSchema.index({ investor: 1, script: 1, type: 1, createdAt: -1 });
investorInteractionSchema.index({ investor: 1, createdAt: -1 });
investorInteractionSchema.index({ script: 1, createdAt: -1 });

export default mongoose.model("InvestorInteraction", investorInteractionSchema);
