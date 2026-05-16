import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
function envMap(fp){const t=fs.readFileSync(fp,'utf8');const m={};for(const l of t.split(/\r?\n/)){const s=l.trim();if(!s||s.startsWith('#')) continue;const i=s.indexOf('=');if(i>0)m[s.slice(0,i)]=s.slice(i+1);}return m;}
const env = envMap(path.join(process.cwd(), '.env.local'));
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

const code='4FZ3YKUF';
const bookingId='3d830c67-efc4-4e5f-a0c1-e8109d6ff181';

const {data:u,error:ue}=await admin.from('users').select('id,name,phone_e164,referral_code,created_at').eq('referral_code',code);
console.log('users by code',ue,u);

const {data:b,error:be}=await admin.from('bookings').select('id,user_id,referrer_code,created_at').eq('id',bookingId).maybeSingle();
console.log('booking',be,b);

const {data:inviterBooking,error:ibe}=await admin.from('bookings').select('id,user_id,referrer_code,created_at').eq('id','de8556c9-3e6f-48ed-b0e3-89e682d7426b').maybeSingle();
console.log('inviter booking',ibe,inviterBooking);

const {data:refs,error:re}=await admin.from('referrals').select('*').eq('booking_id',bookingId);
console.log('refs',re,refs);
