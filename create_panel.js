import { config } from "../config.js";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });
  try {
    const { username, password, ram, cpu } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: "Username dan password wajib diisi." });

    // 1) Create user via Pterodactyl Application API
    const userRes = await fetch(`${config.api_url}/users`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
        "Accept": "Application/vnd.pterodactyl.v1+json"
      },
      body: JSON.stringify({
        email: `${username}@example.com`,
        username,
        first_name: username,
        last_name: "User",
        password
      })
    });

    const userText = await userRes.text();
    let userData;
    try { userData = JSON.parse(userText); } catch(e) { userData = userText; }
    if (!userRes.ok) return res.status(500).json({ success:false, error:"Gagal membuat user", detail:userData });

    const userId = userData.attributes?.id;
    if (!userId) return res.status(500).json({ success:false, error:"User ID tidak ditemukan", detail:userData });

    // 2) Create server
    const serverRes = await fetch(`${config.api_url}/servers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
        "Accept": "Application/vnd.pterodactyl.v1+json"
      },
      body: JSON.stringify({
        name: `${username}_server`,
        user: userId,
        egg: config.egg_id,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: "npm start",
        environment: { USER_UPLOAD: "1" },
        limits: { memory: ram === "Unlimited" ? 0 : parseInt(ram)*1024, cpu: cpu === "Unlimited" ? 0 : parseInt(cpu)*100, disk: 10240 },
        feature_limits: { databases: 1, allocations: 1 },
        allocation: { default: 1 },
        nest: config.nest_id,
        location: config.location_id,
        start_on_completion: true
      })
    });

    const serverText = await serverRes.text();
    let serverData;
    try { serverData = JSON.parse(serverText); } catch(e) { serverData = serverText; }
    if (!serverRes.ok) return res.status(500).json({ success:false, error:"Gagal membuat server", detail:serverData });

    // append to /tmp logs so Vercel can write
    const logPath = path.join("/tmp", "logs.txt");
    const line = `${new Date().toISOString()} | Created panel for ${username} | ram=${ram} | cpu=${cpu}\n`;
    try { fs.appendFileSync(logPath, line); } catch(e) { console.error('Failed to write log', e); }

    return res.status(200).json({ success:true, message:`Panel berhasil dibuat untuk ${username}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:"Terjadi kesalahan internal", detail:err.message });
  }
}
