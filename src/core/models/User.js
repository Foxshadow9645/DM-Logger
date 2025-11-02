import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: String,
  joinDate: { type: Date, default: Date.now },
  roles: [String],
  isStaff: { type: Boolean, default: false },
  infractions: { type: Number, default: 0 }
});

export default mongoose.model("User", userSchema);

