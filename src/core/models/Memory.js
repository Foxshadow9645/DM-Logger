import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // es. channelId o userId
  history: [
    {
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model("Memory", memorySchema);

