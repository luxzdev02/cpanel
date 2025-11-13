import fs from "fs";
import path from "path";
export default async function handler(req, res) {
  try {
    const logPath = path.join("/tmp", "logs.txt");
    if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "");
    const logs = fs.readFileSync(logPath, "utf8");
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(logs || "Belum ada log.");
  } catch (e) {
    res.status(500).send("Gagal membaca log: " + e.message);
  }
}
