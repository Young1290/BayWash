import test from "node:test";
import assert from "node:assert/strict";
import { isSupabaseConfigured, supabase } from "../src/lib/supabase.js";

test("supabase fallback is active when env is missing in node runtime", async () => {
  assert.equal(isSupabaseConfigured, false);
  await assert.rejects(supabase.rpc("submit_booking_mvp_v2", {}), /not configured/i);
});
