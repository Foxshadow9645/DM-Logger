import mongoose from "mongoose";

/**
 * Connessione principale al Database MongoDB
 * Utilizza la variabile MONGODB_URI nel file .env
 */
export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📡 Database connesso a: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ Errore durante la connessione al database:", err.message);
    process.exit(1);
  }
}

