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
  const requiredKeys = ["VITE_COMPANY_NAME", "VITE_SUPPORT_WHATSAPP"];

  const checks = [];
  const addCheck = (ok, key, detail) => checks.push({ ok, key, detail });

  for (const key of requiredKeys) {
    if (!checkNonEmpty(env, key)) {
      addCheck(false, key, "missing");
    } else if (isPlaceholder(env[key])) {
      addCheck(false, key, "placeholder");
    } else {
      addCheck(true, key, "ok");
    }
  }

  const resolvedAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLIC_KEY;
  if (!checkNonEmpty({ VITE_SUPABASE_ANON_KEY: resolvedAnonKey }, "VITE_SUPABASE_ANON_KEY")) {
    addCheck(false, "VITE_SUPABASE_ANON_KEY | VITE_SUPABASE_PUBLIC_KEY", "missing");
  } else if (isPlaceholder(resolvedAnonKey)) {
    addCheck(false, "VITE_SUPABASE_ANON_KEY | VITE_SUPABASE_PUBLIC_KEY", "placeholder");
  } else {
    const keySource = env.VITE_SUPABASE_ANON_KEY ? "VITE_SUPABASE_ANON_KEY" : "VITE_SUPABASE_PUBLIC_KEY";
    addCheck(true, "VITE_SUPABASE_ANON_KEY | VITE_SUPABASE_PUBLIC_KEY", `ok (using ${keySource})`);
  }

  if (!checkNonEmpty(env, "VITE_SUPABASE_URL")) {
    addCheck(false, "VITE_SUPABASE_URL", "missing");
  } else if (isPlaceholder(env.VITE_SUPABASE_URL)) {
    addCheck(false, "VITE_SUPABASE_URL", "placeholder");
  } else {
    let host = "";
    try {
      host = new URL(env.VITE_SUPABASE_URL).host;
    } catch {
      addCheck(false, "VITE_SUPABASE_URL", "invalid URL format");
      host = "";
    }

    if (host) {
      try {
        const addresses = await dns.lookup(host, { all: true });
        if (!addresses || addresses.length === 0) {
          throw new Error("resolved empty DNS result");
        }
        addCheck(true, "VITE_SUPABASE_URL", `dns ok (${host})`);
      } catch (error) {
        addCheck(
          false,
          "VITE_SUPABASE_URL",
          `dns failed (${host}) (${error.code || error.message})`
        );
      }
    }
  }

  console.log("Environment validation checks:");
  for (const item of checks) {
    console.log(`- ${item.ok ? "PASS" : "FAIL"} | ${item.key} | ${item.detail}`);
  }

  const failed = checks.filter((item) => !item.ok);
  if (failed.length > 0) {
    console.log("\nSuggested fixes:");
    if (failed.some((x) => x.key === "VITE_SUPABASE_URL")) {
      console.log(
        "- Copy Project URL from Supabase Dashboard -> Settings -> API and set VITE_SUPABASE_URL."
      );
    }
    if (
      failed.some(
        (x) => x.key === "VITE_SUPABASE_ANON_KEY | VITE_SUPABASE_PUBLIC_KEY"
      )
    ) {
      console.log(
        "- Copy anon/public key from Supabase Dashboard -> Settings -> API and set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLIC_KEY."
      );
    }
    if (failed.some((x) => x.key === "VITE_COMPANY_NAME")) {
      console.log("- Set VITE_COMPANY_NAME to your real operating entity name.");
    }
    if (failed.some((x) => x.key === "VITE_SUPPORT_WHATSAPP")) {
      console.log("- Set VITE_SUPPORT_WHATSAPP to your real support WhatsApp number.");
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nAll environment checks passed.");
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
