import fs from "node:fs";
import path from "node:path";
import dns from "node:dns/promises";

function readEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

function checkNonEmpty(env, key) {
  return Boolean(env[key] && String(env[key]).trim());
}

function isPlaceholder(value) {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return true;
  return (
    v.includes("YOUR_") ||
    v.includes("XXXXX") ||
    v.includes("EXAMPLE") ||
    v === "+60XXXXXXXXX"
  );
}

async function run() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local");
  }

  const env = readEnv(envPath);
  const requiredKeys = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_COMPANY_NAME",
    "VITE_SUPPORT_WHATSAPP",
  ];

  const missing = requiredKeys.filter((key) => !checkNonEmpty(env, key));
  if (missing.length > 0) {
    throw new Error(`Missing keys in .env.local: ${missing.join(", ")}`);
  }
  const placeholderKeys = requiredKeys.filter((key) => isPlaceholder(env[key]));
  if (placeholderKeys.length > 0) {
    throw new Error(`Placeholder values detected in .env.local: ${placeholderKeys.join(", ")}`);
  }

  let host = "";
  try {
    host = new URL(env.VITE_SUPABASE_URL).host;
  } catch {
    throw new Error("VITE_SUPABASE_URL is not a valid URL");
  }

  try {
    const addresses = await dns.lookup(host, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error("resolved empty DNS result");
    }
  } catch (error) {
    throw new Error(
      `Supabase host cannot be resolved: ${host} (${error.code || error.message})`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        supabase_host: host,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
