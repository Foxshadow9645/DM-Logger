import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true }, // High Staff, Partnership, Assistenza
  status: { type: String, default: "open" },
  staffAssigned: String,
  createdAt: { type: Date, default: Date.now },
  closedAt: Date
});

export default mongoose.model("Ticket", ticketSchema);

