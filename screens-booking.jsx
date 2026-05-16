// screens-booking.jsx — 2-step booking flow + Confirmation

const { Icon } = window;

function StepHeader({ step, total = 2, title, sub, onBack }) {
  return (
    <div style={{ padding: '12px 22px 16px' }}>
      <div className="bw-row" style={{ marginBottom: 14 }}>
        <button className="bw-iconbtn" onClick={onBack}><Icon.ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--bw-muted)' }}>
          Step {step} of {total}
        </div>
        <div style={{ width: 38 }} />
      </div>
      <div className="bw-steps" style={{ marginBottom: 18 }}>
        {Array.from({ length: total }).map((_, i) =>
        <div key={i} className={`bw-pip ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}`} />
        )}
      </div>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</h1>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--bw-muted)', lineHeight: 1.45 }}>{sub}</p>}
    </div>);
}

function StepFooter({ primary = 'Continue', onPrimary }) {
  return (
    <div style={{ padding: '14px 22px 24px', borderTop: '1px solid var(--bw-line-soft)', background: 'var(--bw-bg)' }}>
      <button className="bw-btn primary block lg" onClick={onPrimary}>
        {primary}
        <Icon.ArrowRight size={18} color="#fff" />
      </button>
    </div>);
}

function SectionTitle({ children }) {
  return <h2 className="bw-h2" style={{ margin: '4px 0 10px' }}>{children}</h2>;
}

// ────────────────────────────────────────────────────────────
// Step 1 — Location + Vehicle (combined)
// ────────────────────────────────────────────────────────────
function ScreenLocation({ theme = '', font = '' }) {
  return (
    <div className={`bw-screen ${theme} ${font}`}>
      <StepHeader step={1} total={2} title="Where & what?" sub="Tell us where the car is parked, and which one." />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
        <SectionTitle>Location</SectionTitle>
        <div className="bw-stack" style={{ gap: 14 }}>
          <div className="bw-field">
            <label className="bw-label">Condo</label>
            <div className="bw-select bw-row" style={{ gap: 10 }}>
              <Icon.Building size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1 }}>The Sentral Residences</span>
              <Icon.Chevron size={16} color="var(--bw-muted)" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="bw-field">
              <label className="bw-label">Carpark floor</label>
              <div className="bw-input bw-row" style={{ gap: 10 }}>
                <Icon.Floor size={18} color="var(--bw-muted)" />
                <span style={{ flex: 1 }}>B2</span>
              </div>
            </div>
            <div className="bw-field">
              <label className="bw-label">Bay number</label>
              <div className="bw-input bw-row focused" style={{ gap: 10 }}>
                <Icon.Hash size={18} color="var(--bw-muted)" />
                <span style={{ flex: 1 }}>47</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 22 }} />
        <SectionTitle>Vehicle</SectionTitle>
        <div className="bw-stack" style={{ gap: 14 }}>
          <div className="bw-field">
            <label className="bw-label">Plate number</label>
            <div className="bw-input bw-row" style={{ gap: 10, fontFamily: 'var(--bw-font-mono)', letterSpacing: '0.04em' }}>
              <Icon.Car size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1, fontWeight: 600 }}>WMK 8821</span>
            </div>
          </div>

          <div className="bw-field">
            <label className="bw-label">Car photo</label>
            <div className="bw-card" style={{
              height: 160, borderRadius: 12, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #2A322C 0%, #0E1410 100%)',
              borderColor: 'var(--bw-line)'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 320 180" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <linearGradient id="carBody" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#F4F2EC" stopOpacity="0.95" />
                    <stop offset="1" stopColor="#9AA29D" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                <ellipse cx="160" cy="155" rx="120" ry="6" fill="rgba(0,0,0,0.4)" />
                <path d="M50 130 L70 95 Q90 80 130 78 L200 78 Q235 80 250 95 L280 105 Q288 108 285 130 L50 130 Z"
                fill="url(#carBody)" />
                <path d="M85 95 Q92 84 130 82 L165 82 L165 100 L80 100 Z" fill="rgba(0,0,0,0.35)" />
                <path d="M165 82 L195 82 Q225 84 240 95 L240 100 L165 100 Z" fill="rgba(0,0,0,0.35)" />
                <circle cx="105" cy="135" r="14" fill="#0E1410" />
                <circle cx="105" cy="135" r="6" fill="#9AA29D" />
                <circle cx="235" cy="135" r="14" fill="#0E1410" />
                <circle cx="235" cy="135" r="6" fill="#9AA29D" />
              </svg>
              <div style={{
                position: 'absolute', bottom: 12, left: 12, right: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>UPLOADED</div>
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>civic-front.jpg</div>
                </div>
                <button className="bw-btn outline" style={{
                  height: 36, padding: '0 12px', fontSize: 13,
                  background: 'rgba(255,255,255,0.95)'
                }}>
                  <Icon.Camera size={14} /> Replace
                </button>
              </div>
            </div>
            <div className="bw-help" style={{ marginTop: 8 }}>Helps our crew find you in dark carparks.</div>
          </div>
        </div>
      </div>
      <StepFooter />
    </div>);
}

// ────────────────────────────────────────────────────────────
// Step 2 — Schedule + WhatsApp contact (combined)
// ────────────────────────────────────────────────────────────
function ScreenSchedule({ theme = '', font = '' }) {
  const days = [
    { d: 'Wed', n: '7', sub: 'Today' },
    { d: 'Thu', n: '8' },
    { d: 'Fri', n: '9' },
    { d: 'Sat', n: '10' },
    { d: 'Sun', n: '11' },
    { d: 'Mon', n: '12' }];

  const ranges = [
    { t: '6 AM – 9 AM', sub: 'Early morning', avail: true },
    { t: '9 AM – 12 PM', sub: 'Morning', avail: true },
    { t: '12 PM – 3 PM', sub: 'Afternoon', avail: true, sel: true },
    { t: '3 PM – 6 PM', sub: 'Full', avail: false },
    { t: '6 PM – 9 PM', sub: 'Evening', avail: true },
    { t: '9 PM – 12 AM', sub: 'Late night', avail: true }];

  return (
    <div className={`bw-screen ${theme} ${font}`}>
      <StepHeader step={2} total={2} title="When & how to reach you?" sub="Pick a window — we'll WhatsApp you when done." />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
        <SectionTitle>Day</SectionTitle>
        <div className="bw-row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 18 }}>
          {days.map((d, i) => {
            const sel = i === 0;
            return (
              <div key={d.n} style={{
                flex: 'none', width: 56, padding: '10px 0', borderRadius: 12,
                textAlign: 'center', cursor: 'pointer',
                background: sel ? 'var(--bw-ink)' : 'var(--bw-surface)',
                color: sel ? '#fff' : 'var(--bw-ink)',
                border: '1px solid ' + (sel ? 'var(--bw-ink)' : 'var(--bw-line)')
              }}>
                <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.05em' }}>{d.d.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2, fontFamily: 'var(--bw-font-display)', fontStyle: 'italic' }}>{d.n}</div>
                {d.sub && <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 2, letterSpacing: '0.04em' }}>{d.sub.toUpperCase()}</div>}
              </div>);
          })}
        </div>

        <SectionTitle>Time slot</SectionTitle>
        <div className="bw-field">
          <div className="bw-select bw-row focused" style={{ gap: 12, height: 60, padding: '0 18px' }}>
            <Icon.Clock size={20} color="var(--bw-primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--bw-ink)' }}>12 PM – 3 PM</div>
              <div style={{ fontSize: 12, color: 'var(--bw-muted)', marginTop: 2 }}>Afternoon · 2 cleaners available</div>
            </div>
            <Icon.Chevron size={18} color="var(--bw-muted)" />
          </div>
          <div className="bw-help" style={{ marginTop: 8 }}>Tap to choose another window</div>
        </div>
        {/* Open dropdown preview */}
        <div className="bw-card" style={{ padding: 6, marginTop: 8, boxShadow: 'var(--bw-shadow)' }}>
          {ranges.map((s, i) =>
          <div key={s.t} className="bw-row" style={{
            padding: '12px 14px', gap: 12, borderRadius: 10,
            background: s.sel ? 'var(--bw-primary-soft)' : 'transparent',
            opacity: s.avail ? 1 : 0.4, cursor: s.avail ? 'pointer' : 'not-allowed'
          }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: s.sel ? 'var(--bw-primary-ink)' : 'var(--bw-ink)' }}>{s.t}</div>
                <div style={{ fontSize: 12, color: 'var(--bw-muted)', marginTop: 1 }}>{s.sub}</div>
              </div>
              {s.sel ?
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'var(--bw-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'
              }}><Icon.Check size={14} color="#fff" stroke={2.4} /></div> :
              !s.avail && <span className="bw-chip muted" style={{ height: 22, fontSize: 11 }}>Full</span>}
            </div>
          )}
        </div>

        <div style={{ height: 22 }} />
        <SectionTitle>WhatsApp notification</SectionTitle>
        <div className="bw-field">
          <label className="bw-label">Mobile number</label>
          <div className="bw-input bw-row focused" style={{ gap: 10 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 5, background: '#25D366',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                <path d="M20 4a11 11 0 0 0-17 13L2 22l5-1a11 11 0 0 0 13-17zm-8 16a9 9 0 0 1-4.6-1.3l-.3-.2-3 .8.8-3-.2-.3A9 9 0 1 1 12 20zm5-7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.3 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4 5 5 0 0 0 3 .6 2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .1-1.2c-.1-.1-.3-.2-.6-.3z"/>
              </svg>
            </span>
            <span style={{ color: 'var(--bw-muted)', fontSize: 14, fontWeight: 600 }}>+60</span>
            <span style={{ flex: 1 }}>12 345 6789</span>
            <Icon.Check size={16} color="var(--bw-primary)" stroke={2.4} />
          </div>
          <div className="bw-help" style={{ marginTop: 6 }}>We'll WhatsApp you when your wash is done.</div>
        </div>

        <div className="bw-card" style={{ padding: 14, marginTop: 16 }}>
          <div className="bw-row" style={{ gap: 10 }}>
            <Icon.Clock size={18} color="var(--bw-muted)" />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--bw-ink-2)' }}>
              Wash takes about <b>25 min</b>. Cleaner arrives within your selected window.
            </div>
          </div>
        </div>
      </div>
      <StepFooter primary="Review booking" />
    </div>);
}

// ────────────────────────────────────────────────────────────
// Confirmation
// ────────────────────────────────────────────────────────────
function SummaryRow({ icon, label, value, mono }) {
  return (
    <div className="bw-row" style={{ padding: '14px 16px', gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: 'var(--bw-line-soft)',
        color: 'var(--bw-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, color: 'var(--bw-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{
          fontSize: 14, fontWeight: 600, marginTop: 2, color: 'var(--bw-ink)',
          fontFamily: mono ? 'var(--bw-font-mono)' : 'var(--bw-font)',
          letterSpacing: mono ? '0.04em' : '-0.005em'
        }}>{value}</div>
      </div>
    </div>);
}

function ScreenConfirm({ theme = '', font = '' }) {
  return (
    <div className={`bw-screen ${theme} ${font}`}>
      <div style={{ padding: '12px 22px 8px' }}>
        <div className="bw-row" style={{ marginBottom: 10 }}>
          <button className="bw-iconbtn"><Icon.ArrowLeft size={18} /></button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--bw-muted)' }}>Almost done</div>
          <div style={{ width: 38 }} />
        </div>
        <h1 style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Confirm booking</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--bw-muted)' }}>Review the details, then pay.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 16px' }}>
        <div className="bw-card lg" style={{ padding: 16, marginBottom: 14, background: 'var(--bw-ink)', color: '#fff', borderColor: 'var(--bw-ink)' }}>
          <div className="bw-row" style={{ gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Icon.Drop size={22} color="#fff" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Single Wash</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Waterless · ~25 min</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--bw-font-display)', fontStyle: 'italic' }}>RM15</div>
          </div>
        </div>

        <div className="bw-card" style={{ padding: 0 }}>
          <SummaryRow icon={<Icon.Pin size={16} />} label="Location" value="Sentral Residences · B2 · Bay 47" />
          <hr className="bw-hr" style={{ marginLeft: 60 }} />
          <SummaryRow icon={<Icon.Car size={16} />} label="Vehicle" value="Honda Civic · WMK 8821" mono />
          <hr className="bw-hr" style={{ marginLeft: 60 }} />
          <SummaryRow icon={<Icon.Calendar size={16} />} label="When" value="Wed, 7 May · 12 PM – 3 PM" />
          <hr className="bw-hr" style={{ marginLeft: 60 }} />
          <SummaryRow icon={<Icon.Bell size={16} />} label="Notify" value="WhatsApp · +60 12 345 6789" />
        </div>

        <div className="bw-card" style={{ padding: 14, marginTop: 14 }}>
          <div className="bw-row" style={{ gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: '#E7F8EC',
              color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4a11 11 0 0 0-17 13L2 22l5-1a11 11 0 0 0 13-17zm-8 16a9 9 0 0 1-4.6-1.3l-.3-.2-3 .8.8-3-.2-.3A9 9 0 1 1 12 20zm5-7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.3 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4 5 5 0 0 0 3 .6 2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .1-1.2c-.1-.1-.3-.2-.6-.3z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>WhatsApp me when done</div>
              <div style={{ fontSize: 12, color: 'var(--bw-muted)', marginTop: 2 }}>Receipt + before/after photos</div>
            </div>
            <div className="bw-switch on" />
          </div>
        </div>

        <div className="bw-card" style={{ padding: 14, marginTop: 14 }}>
          <div className="bw-row" style={{ justifyContent: 'space-between', fontSize: 13, color: 'var(--bw-muted)' }}>
            <span>Single Wash</span><span>RM 15.00</span>
          </div>
          <div className="bw-row" style={{ justifyContent: 'space-between', fontSize: 13, color: 'var(--bw-muted)', marginTop: 6 }}>
            <span>Service fee</span><span>RM 0.00</span>
          </div>
          <hr className="bw-hr" style={{ margin: '12px 0' }} />
          <div className="bw-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 22, fontFamily: 'var(--bw-font-display)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.02em' }}>RM 15.00</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 24px', borderTop: '1px solid var(--bw-line-soft)', background: 'var(--bw-bg)' }}>
        <button className="bw-btn primary block lg" style={{ height: 58 }}>
          <Icon.Card size={18} color="#fff" />
          Confirm & Pay · RM 15
        </button>
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11.5, color: 'var(--bw-muted)' }}>
          Free cancellation up to 1 hour before
        </div>
      </div>
    </div>);
}

// Stub legacy exports so the canvas doesn't 404 — they alias to the combined screens.
const ScreenVehicle = ScreenLocation;
const ScreenContact = ScreenSchedule;

window.ScreenLocation = ScreenLocation;
window.ScreenVehicle = ScreenVehicle;
window.ScreenContact = ScreenContact;
window.ScreenSchedule = ScreenSchedule;
window.ScreenConfirm = ScreenConfirm;
