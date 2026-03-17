import mongoose from "mongoose";

const scriptPitchSchema = new mongoose.Schema({
  script: { type: mongoose.Schema.Types.ObjectId, ref: "Script", required: true },
  writer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  investor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "purchased"],
    default: "pending"
  },
  note: { type: String, maxlength: 500 } // Optional short pitch note
}, { timestamps: true });

export default mongoose.model("ScriptPitch", scriptPitchSchema);