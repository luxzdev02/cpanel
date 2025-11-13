import fs from "fs";
import path from "path";
export default async function handler(req, res) {
  try {
    const logPath = path.join("/tmp", "logs.txt");
    fs.writeFileSync(logPath, "");
    res.status(200).send("✅ Log berhasil direset");
  } catch (e) {
    res.status(500).send("❌ Gagal mereset log: " + e.message);
  }
}
