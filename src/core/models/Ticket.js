import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true }, // High Staff, Partnership, Assistenza
  status: { type: String, default: "open" },
  
  // 👇 QUESTO CAMPO MANCAVA! Senza di lui il bot non ricorda se è reclamato
  claimed: { type: Boolean, default: false }, 
  
  staffId: String, // ID dello staff che lo ha reclamato
  createdAt: { type: Date, default: Date.now },
  closedAt: Date
});

export default mongoose.model("Ticket", ticketSchema);
