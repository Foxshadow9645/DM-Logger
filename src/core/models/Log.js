import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  type: { type: String, required: true },      // es: "ban", "join", "message_delete"
  userId: String,                              // utente coinvolto
  executorId: String,                          // autore/mod
  description: String,                         // descrizione evento
  guildId: String,                             // ID server
  timestamp: { type: Date, default: Date.now } // orario evento
});

export default mongoose.model("Log", logSchema);

