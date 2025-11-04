import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export async function generateTranscript(channel) {
  const transcriptPath = path.resolve(`./transcripts/ticket-${channel.id}.pdf`);

  // Assicuriamoci che la cartella esista
  if (!fs.existsSync("./transcripts")) fs.mkdirSync("./transcripts");

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(transcriptPath));

  doc.fontSize(17).text(`DM REALM ALPHA — Ticket Transcript`, { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(`Ticket: #${channel.name}`);
  doc.text(`Channel ID: ${channel.id}`);
  doc.text(`Data: ${new Date().toLocaleString()}`);
  doc.moveDown();

  const messages = await channel.messages.fetch({ limit: 100 });
  const ordered = messages.reverse(); // ordine cronologico

  for (const msg of ordered.values()) {
    const timestamp = new Date(msg.createdTimestamp).toLocaleString();
    doc.font("Helvetica-Bold").text(`[${timestamp}] ${msg.author.tag}`);
    doc.font("Helvetica").text(msg.content || "*[Allegato / Embed]*");
    doc.moveDown(0.5);
  }

  doc.end();

  return transcriptPath;
}
