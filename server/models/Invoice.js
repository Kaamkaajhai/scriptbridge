import mongoose from "mongoose";

const invoiceRowSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    type: { type: String, required: true },
    detail: { type: String, default: "" },
    amountLabel: { type: String, required: true },
    amountValue: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    paymentReference: { type: String, unique: true, sparse: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creatorSid: { type: String, default: "" },
    script: { type: mongoose.Schema.Types.ObjectId, ref: "Script", required: true },
    scriptSid: { type: String, default: "" },
    accessType: { type: String, enum: ["free", "premium"], default: "free" },
    scriptPrice: { type: Number, default: 0 },
    platformFeeRate: { type: Number, default: 0.2 },
    writerEarnsPerSale: { type: Number, default: 0 },
    services: {
      hosting: { type: Boolean, default: true },
      evaluation: { type: Boolean, default: false },
      aiTrailer: { type: Boolean, default: false },
      trailerUpload: { type: Boolean, default: false },
    },
    totalCreditsRequired: { type: Number, default: 0 },
    creditsBalanceBefore: { type: Number, default: 0 },
    creditsBalanceAfter: { type: Number, default: 0 },
    rows: { type: [invoiceRowSchema], default: [] },
    pdfPath: { type: String, default: "" },
    pdfGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ creator: 1, createdAt: -1 });
invoiceSchema.index({ script: 1 });

export default mongoose.model("Invoice", invoiceSchema);
