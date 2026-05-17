import { spawnSync } from "node:child_process";

const gates = [
  { name: "Unit tests", args: ["run", "test"] },
  { name: "Production build", args: ["run", "build"] },
  { name: "Env validation", args: ["run", "check:env"] },
  { name: "RPC smoke test", args: ["run", "smoke:rpc"] },
];

function runGate(gate) {
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
  const args = npmCli ? [npmCli, ...gate.args] : gate.args;
  const result = spawnSync(command, args, {
    stdio: "inherit",
  });
  const code = result.status ?? 1;
  return {
    name: gate.name,
    ok: code === 0,
    code,
  };
}

function printSummary(results) {
  console.log("\nRelease audit summary:");
  for (const row of results) {
    console.log(`- ${row.ok ? "PASS" : "FAIL"} | ${row.name} (exit ${row.code})`);
  }
}

const results = gates.map(runGate);
printSummary(results);

const failed = results.some((item) => !item.ok);
if (failed) {
  process.exitCode = 1;
}
