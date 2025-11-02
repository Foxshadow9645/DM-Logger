import express from "express";
import { respondRouter } from "./router/respond.js";

const app = express();
app.use(express.json());

// 🧠 Rotte IA
app.use("/respond", respondRouter);

const PORT = process.env.AI_PORT || 4000;
app.listen(PORT, () => {
  console.log(`🤖 DM ALPHA AI Microservice attivo sulla porta ${PORT}`);
});

