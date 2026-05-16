// screens-auth.jsx — Login + Sign Up
// Both use the same minimal centered layout grounded in BayWash type system.

const { Icon } = window;

function BWStatusBar({ time = '9:41', dark = false }) {
  // Lightweight stub for use INSIDE device frames where the frame already
  // supplies its own statusbar; we render this only for canvas-only screens.
  return null;
}

function BWLogo({ size = 'md' }) {
  const big = size === 'lg';
  return (
    <div className="bw-logo" style={{ fontSize: big ? 36 : 26, gap: big ? 12 : 8 }}>
      <span className="mark" style={big ? { width: 44, height: 44, borderRadius: 12, fontSize: 22 } : {}}>B</span>
      <span style={{ fontStyle: 'italic' }}>BayWash</span>
    </div>);

}

// ────────────────────────────────────────────────────────────
// Login
// ────────────────────────────────────────────────────────────
function ScreenLogin({ theme = '', font = '' }) {
  return (
    <div className={`bw-screen ${theme} ${font}`}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ marginBottom: 36 }}>
          <BWLogo size="lg" />
          <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.45,
            color: 'var(--bw-muted)', maxWidth: 280 }}>
            Waterless car wash, brought right to your carpark bay.
          </p>
        </div>

        <div className="bw-stack" style={{ gap: 14 }}>
          <div className="bw-field">
            <label className="bw-label">Email</label>
            <div className="bw-input bw-row" style={{ gap: 10 }}>
              <Icon.Mail size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1, color: 'var(--bw-ink)' }}>aisha@gmail.com</span>
            </div>
          </div>
          <div className="bw-field">
            <label className="bw-label">Password</label>
            <div className="bw-input bw-row focused" style={{ gap: 10 }}>
              <Icon.Lock size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1, color: 'var(--bw-ink)', letterSpacing: '0.18em' }}>••••••••</span>
              <Icon.Eye size={18} color="var(--bw-muted)" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -2 }}>
            <span style={{ fontSize: 13, color: 'var(--bw-primary)', fontWeight: 600 }}>Forgot password?</span>
          </div>
        </div>

        <button className="bw-btn primary block lg" style={{ marginTop: 24 }}>
          Log in
          <Icon.ArrowRight size={18} color="#fff" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' }}>
          <hr className="bw-hr" style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--bw-muted-2)', letterSpacing: '0.06em' }}>OR</span>
          <hr className="bw-hr" style={{ flex: 1 }} />
        </div>

        <div className="bw-stack" style={{ gap: 10 }}>
          <button className="bw-btn outline block" style={{ height: 50 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4, background: '#fff',
              border: '1px solid var(--bw-line)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
              color: '#4285F4'
            }}>G</span>
            Continue with Google
          </button>
          <button className="bw-btn ghost block" style={{ height: 50, color: 'var(--bw-ink-2)' }}>
            <Icon.User size={16} color="var(--bw-ink-2)" />
            Continue as Guest
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 28px 28px', textAlign: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--bw-muted)' }}>
          New to BayWash? <a href="#" style={{ color: 'var(--bw-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</a>
        </span>
      </div>
    </div>);

}

// ────────────────────────────────────────────────────────────
// Sign Up
// ────────────────────────────────────────────────────────────
function ScreenSignUp({ theme = '', font = '' }) {
  return (
    <div className={`bw-screen ${theme} ${font}`}>
      <div style={{ padding: '20px 22px 0' }}>
        <button className="bw-iconbtn" aria-label="Back">
          <Icon.ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="bw-h1" style={{ fontSize: 36 }}>Create your <em>account</em></h1>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5, color: 'var(--bw-muted)' }}>
            Takes about 30 seconds. <b style={{ color: 'var(--bw-ink)' }}></b>.
          </p>
        </div>

        <div className="bw-stack" style={{ gap: 14 }}>
          <div className="bw-field">
            <label className="bw-label">Full name</label>
            <div className="bw-input bw-row" style={{ gap: 10 }}>
              <Icon.User size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1, color: 'var(--bw-ink)' }}>Aisha Rahman</span>
            </div>
          </div>
          <div className="bw-field">
            <label className="bw-label">Email</label>
            <div className="bw-input bw-row" style={{ gap: 10 }}>
              <Icon.Mail size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1, color: 'var(--bw-muted-2)', fontWeight: 400 }}>you@email.com</span>
            </div>
          </div>
          <div className="bw-field">
            <label className="bw-label">Password</label>
            <div className="bw-input bw-row" style={{ gap: 10 }}>
              <Icon.Lock size={18} color="var(--bw-muted)" />
              <span style={{ flex: 1, color: 'var(--bw-muted-2)', fontWeight: 400 }}>At least 8 characters</span>
            </div>
          </div>
        </div>

        <p style={{ marginTop: 18, fontSize: 12, lineHeight: 1.5, color: 'var(--bw-muted)' }}>
          By signing up you agree to our <span style={{ color: 'var(--bw-ink)', fontWeight: 500 }}>Terms</span> and <span style={{ color: 'var(--bw-ink)', fontWeight: 500 }}>Privacy Policy</span>.
        </p>

        <button className="bw-btn primary block lg" style={{ marginTop: 22 }}>
          Create account
          <Icon.ArrowRight size={18} color="#fff" />
        </button>
      </div>

      <div style={{ padding: '20px 28px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--bw-muted)' }}>
          Already have an account? <a href="#" style={{ color: 'var(--bw-primary)', fontWeight: 600, textDecoration: 'none' }}>Log in</a>
        </span>
      </div>
    </div>);

}

window.ScreenLogin = ScreenLogin;
window.ScreenSignUp = ScreenSignUp;
window.BWLogo = BWLogo;