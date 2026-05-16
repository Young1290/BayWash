# WashNear MVP (React + Supabase)

Single-page doorstep car wash booking app with:
- simple booking form
- `English / Chinese / Bahasa Melayu` language switch (persisted locally)
- referral capture from `?ref=CODE` links
- referral sharing after booking

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run app:
   ```bash
   npm run dev
   ```
4. Run validation checks:
   ```bash
   npm test
   npm run build
   ```
5. Optional live RPC smoke test (uses current `.env.local`):
   ```bash
   npm run smoke:rpc
   ```

## Supabase setup

1. Open Supabase SQL editor.
2. Run [supabase/schema.sql](supabase/schema.sql).
3. Confirm tables exist:
   - `users`
   - `bookings`
   - `referrals`
4. Confirm SQL function exists:
   - `submit_booking_mvp_v2(...)`

## Booking flow (v2)

- Frontend submits a single RPC call to `submit_booking_mvp_v2`.
- DB function creates/updates user by `phone_e164`, inserts booking, and inserts referral idempotently.
- Referral attribution is resolved by `referrer_code` ownership in DB.
- `p_referrer_user_id` is treated as an optional consistency signal only:
  - if it mismatches the owner of `referrer_code`, DB ignores the mismatch and uses code owner as source of truth.
  - if there is no valid `referrer_code`, no referral attribution is created.

## Security and integrity notes

- Anonymous direct table writes are blocked by RLS policy design (no `anon` insert policies on `users`, `bookings`, `referrals`).
- Anonymous booking intake is allowed through `submit_booking_mvp_v2` (`SECURITY DEFINER`) only.
- DB checks enforce:
  - booking slot in `night_1 | night_2 | night_3 | night_4`
  - booking date `>= current_date`
  - booking date weekday only (`Monday-Friday`)
  - referral code format checks on `users.referral_code` and nullable `bookings.referrer_code`
- Referral insert is idempotent via unique triplet and `ON CONFLICT DO NOTHING`.

## Booking payload contract

Frontend submission shape:

```json
{
  "name": "string",
  "phone": "+60123456789",
  "address": "string",
  "carparkLocation": "string",
  "planType": "single | monthly",
  "carAvailableDate": "YYYY-MM-DD",
  "carAvailableSlot": "night_1 | night_2 | night_3 | night_4",
  "referrerCode": "string | null",
  "referrerUserId": "uuid | null"
}
```

Phone normalization accepts only explicit Malaysia prefixes:
- `0...`
- `60...`
- `+60...`
- `0060...`

Unprefixed ambiguous digits (for example `123456789`) are rejected.

## UI trust placeholders

Trust module text includes placeholders to replace for production:
- company name
- WhatsApp customer service number

## Go-live checklist

1. Set production env vars in deploy platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_COMPANY_NAME`
   - `VITE_SUPPORT_WHATSAPP`
2. Run latest [supabase/schema.sql](supabase/schema.sql) on production Supabase.
3. Smoke test booking flow:
   - normal booking creates one `bookings` row
   - referral link booking creates one `referrals` row (when valid)
4. Confirm multilingual UI renders correctly (`English / Chinese / Bahasa Melayu`).

## Vercel deployment

1. Import this GitHub repo into Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_COMPANY_NAME`
   - `VITE_SUPPORT_WHATSAPP`
6. Deploy and run smoke test with a real booking.
