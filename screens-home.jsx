// screens-home.jsx — Home dashboard with Single Wash + Monthly Pass + active wash status

const { Icon } = window;

function ActiveWashCard() {
  return (
    <div className="bw-card lg" style={{
      padding: 18, background: 'var(--bw-ink)', color: '#fff',
      borderColor: 'var(--bw-ink)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -30, top: -30, width: 140, height: 140,
        borderRadius: '50%', background: 'var(--bw-primary)', opacity: 0.5, filter: 'blur(30px)',
      }} />
      <div style={{ position: 'relative' }}>
        <div className="bw-row" style={{ gap: 8, marginBottom: 14 }}>
          <span className="bw-chip live">LIVE</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>WASH IN PROGRESS</span>
        </div>
        <div className="bw-row" style={{ gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, flex: 'none',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.Car size={26} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Honda Civic · WMK 8821</div>
            <div className="bw-row" style={{ gap: 6, marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              <Icon.Pin size={13} color="rgba(255,255,255,0.7)" />
              B2 · Bay 47
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', fontFamily: 'var(--bw-font-display)', fontStyle: 'italic' }}>~12 min</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>REMAINING</div>
          </div>
        </div>
        {/* progress */}
        <div style={{ marginTop: 16, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: 'var(--bw-primary)', borderRadius: 2 }} />
        </div>
        <div className="bw-row" style={{ marginTop: 8, justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
          <span>Pre-wipe · Foam · <b style={{ color: '#fff' }}>Polish</b></span>
          <span>62%</span>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ title, sub, price, suffix, icon, badge, primary }) {
  return (
    <div className="bw-card lg" style={{
      padding: 18, position: 'relative',
      background: primary ? 'var(--bw-primary)' : 'var(--bw-surface)',
      borderColor: primary ? 'var(--bw-primary)' : 'var(--bw-line)',
      color: primary ? '#fff' : 'var(--bw-ink)',
    }}>
      {badge && (
        <span className="bw-chip" style={{
          position: 'absolute', top: 14, right: 14,
          background: primary ? 'rgba(255,255,255,0.18)' : 'var(--bw-primary-soft)',
          color: primary ? '#fff' : 'var(--bw-primary-ink)',
        }}>{badge}</span>
      )}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: primary ? 'rgba(255,255,255,0.15)' : 'var(--bw-primary-soft)',
        color: primary ? '#fff' : 'var(--bw-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ marginTop: 16, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: primary ? 'rgba(255,255,255,0.75)' : 'var(--bw-muted)', lineHeight: 1.4 }}>{sub}</div>
      <div className="bw-row" style={{ marginTop: 14, alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em',
          fontFamily: 'var(--bw-font-display)', fontStyle: 'italic',
        }}>RM{price}</span>
        <span style={{ fontSize: 13, color: primary ? 'rgba(255,255,255,0.7)' : 'var(--bw-muted)' }}>{suffix}</span>
      </div>
    </div>
  );
}

function ScreenHome({ theme = '', font = '', showActive = true }) {
  return (
    <div className={`bw-screen ${theme} ${font}`}>
      <div className="bw-topbar" style={{ paddingTop: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--bw-muted)' }}>Hi Aisha,</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>let's clean it up.</div>
        </div>
        <button className="bw-iconbtn"><Icon.Bell size={18} /></button>
        <button className="bw-iconbtn"><Icon.User size={18} /></button>
      </div>

      <div style={{ padding: '0 22px', overflowY: 'auto', flex: 1, paddingBottom: 28 }}>
        {showActive && (
          <div style={{ marginBottom: 18 }}>
            <ActiveWashCard />
          </div>
        )}

        <h2 className="bw-h2" style={{ marginTop: 4 }}>Book a wash</h2>
        <div className="bw-stack" style={{ gap: 12 }}>
          <ServiceCard
            title="Single Wash"
            sub="One-time waterless wash, finished in 25 minutes."
            price="15"
            suffix="/ wash"
            icon={<Icon.Drop size={22} />}
            primary
          />
          <ServiceCard
            title="Monthly Pass"
            sub="3 washes per month. Auto-renews. Cancel anytime."
            price="40"
            suffix="/ month"
            icon={<Icon.Sparkle size={22} />}
            badge="SAVE 11%"
          />
        </div>

        <h2 className="bw-h2" style={{ marginTop: 24 }}>Your garage</h2>
        <div className="bw-card" style={{ padding: 14 }}>
          <div className="bw-row" style={{ gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'var(--bw-line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bw-ink-2)',
            }}><Icon.Car size={22} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Honda Civic</div>
              <div style={{ fontSize: 12, color: 'var(--bw-muted)', marginTop: 2 }}>WMK 8821 · Pearl White</div>
            </div>
            <Icon.ChevronR size={18} color="var(--bw-muted-2)" />
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenHome = ScreenHome;
