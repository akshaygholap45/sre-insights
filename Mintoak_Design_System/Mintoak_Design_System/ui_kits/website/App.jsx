// Mintoak Marketing Website — UI kit. Single-file React.
const { useState, useEffect, useRef } = React;

function Icon({ name, size = 20, color = "currentColor", sw = 1.75, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({ attrs: { width: size, height: size, stroke: color, "stroke-width": sw }, nameAttr: "data-lucide" });
    }
  }, [name, size, color, sw]);
  return <span ref={ref} style={{ display: "inline-flex", width: size, height: size, ...style }} />;
}

function CTA({ children, variant = "primary", size = "md", icon }) {
  const [h, setH] = useState(false);
  const pad = size === "lg" ? "14px 26px" : "10px 18px";
  const fs = size === "lg" ? 16 : 14;
  const styles = variant === "primary"
    ? { background: h ? "var(--mint-600)" : "var(--mint)", color: "#1C1C1C" }
    : variant === "dark" ? { background: h ? "#000" : "var(--forest-ink)", color: "#fff" }
    : { background: h ? "var(--mint-tint)" : "#fff", color: "var(--forest-oak)", border: "1px solid var(--color-border)" };
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ font: `700 ${fs}px/1 var(--font-sans)`, padding: pad, borderRadius: 12, border: "1px solid transparent",
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "background .15s", ...styles }}>
      {children}{icon && <Icon name={icon} size={fs + 2} />}
    </button>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const links = ["Products", "Solutions", "Pricing", "Partners", "Resources"];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,.86)",
      backdropFilter: "blur(12px)", borderBottom: "1px solid var(--color-border-secondary)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", height: 68, display: "flex", alignItems: "center", gap: 32, padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="../../assets/logo/mintoak-horizontal-green.svg" height="30" />
        </div>
        <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {links.map((l, i) => (
            <div key={l} style={{ position: "relative" }} onMouseEnter={() => i === 0 && setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <button style={{ border: "none", background: "none", cursor: "pointer", font: "500 14px/1 var(--font-sans)",
                color: "var(--color-text-secondary)", padding: "8px 12px", display: "flex", alignItems: "center", gap: 5 }}>
                {l}{i < 2 && <Icon name="chevron-down" size={15} color="var(--neutral-500)" />}
              </button>
              {i === 0 && open && (
                <div style={{ position: "absolute", top: 40, left: 0, width: 300, background: "#fff", borderRadius: 14,
                  boxShadow: "var(--shadow-lg)", border: "1px solid var(--color-border-secondary)", padding: 8 }}>
                  {[["smartphone", "Merchant App", "Accept UPI, cards & QR"], ["radio", "Soundbox", "Instant audio confirmations"], ["layout-dashboard", "Bank CRM", "Portfolio & onboarding"], ["chart-pie", "Analytics", "Merchant insights"]].map(([ic, t, s]) => (
                    <div key={t} style={{ display: "flex", gap: 12, padding: 10, borderRadius: 10, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--mint-tint)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--mint-tint)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        <Icon name={ic} size={18} color="var(--mint-700)" /></span>
                      <div><div style={{ font: "700 13px/1.2 var(--font-sans)", color: "var(--color-text)" }}>{t}</div>
                        <div style={{ font: "400 12px/1.3 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 2 }}>{s}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ border: "none", background: "none", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--color-text)" }}>Sign in</button>
          <CTA icon="arrow-right">Book a demo</CTA>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section style={{ background: "linear-gradient(180deg,var(--mint-tint),#fff)", padding: "76px 24px 64px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid var(--mint-200)",
          borderRadius: 999, padding: "6px 14px", font: "600 12px/1 var(--font-sans)", color: "var(--mint-800)", marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--mint)" }} /> Trusted by 30+ banks across 4 countries
        </span>
        <h1 style={{ font: "900 56px/1.06 var(--font-sans)", color: "var(--forest-oak)", letterSpacing: "-.02em", margin: "0 0 20px" }}>
          The merchant payments platform banks <span style={{ color: "var(--mint-600)" }}>grow with</span>.
        </h1>
        <p style={{ font: "400 19px/1.55 var(--font-sans)", color: "var(--color-text-secondary)", maxWidth: 600, margin: "0 auto 32px" }}>
          Mintoak gives banks a white‑labelled app, soundbox and CRM to onboard, serve and retain small merchants — payments, insights and rewards in one stack.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <CTA size="lg" icon="arrow-right">Book a demo</CTA>
          <CTA size="lg" variant="ghost" icon="play">See it in action</CTA>
        </div>
        <div style={{ marginTop: 56, height: 300, background: "#fff", borderRadius: 20, border: "1px solid var(--color-border-secondary)",
          boxShadow: "var(--shadow-xl)", display: "flex", overflow: "hidden" }}>
          <div style={{ width: 220, background: "var(--forest-ink)", padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <img src="../../assets/logo/mintoak-horizontal-white.svg" height="20" />
            </div>
            {["Dashboard", "Merchants", "Settlements", "Reports"].map((l, i) => (
              <div key={l} style={{ font: "500 13px/1 var(--font-sans)", color: i === 0 ? "var(--mint)" : "rgba(255,255,255,.6)",
                background: i === 0 ? "rgba(128,195,65,.15)" : "transparent", borderRadius: 7, padding: "9px 11px", marginBottom: 4 }}>{l}</div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 24, textAlign: "left" }}>
            <div style={{ font: "700 16px/1 var(--font-sans)", color: "var(--forest-oak)", marginBottom: 18 }}>Portfolio overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {[["Volume", "₹4.82 Cr"], ["Merchants", "1,284"], ["Settled", "₹6.1 L"]].map(([k, v]) => (
                <div key={k} style={{ background: "var(--neutral-50)", borderRadius: 12, padding: 16 }}>
                  <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--color-text-tertiary)" }}>{k}</div>
                  <div style={{ font: "700 22px/1.1 var(--font-sans)", color: "var(--forest-oak)", marginTop: 8 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 90, marginTop: 20 }}>
              {[50, 72, 44, 86, 64, 96, 58].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "5px 5px 0 0", background: i === 5 ? "var(--mint)" : "var(--mint-200)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section style={{ padding: "36px 24px", borderBottom: "1px solid var(--color-border-secondary)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <div style={{ font: "600 12px/1 var(--font-sans)", color: "var(--color-text-tertiary)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 22 }}>Powering payments for leading banks</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24, opacity: .6 }}>
          {["HDFC Bank", "Axis Bank", "SBI", "Citi", "ICICI", "Yes Bank"].map(b => (
            <span key={b} style={{ font: "700 19px/1 var(--font-sans)", color: "var(--forest-oak)" }}>{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const F = [
    ["smartphone", "Accept every payment", "UPI, cards, QR and soundbox in one white‑labelled merchant app — live in minutes."],
    ["zap", "Onboard in under 5 minutes", "Digital KYC, instant VPA creation and bank‑grade verification, fully branded for your bank."],
    ["banknote", "Settlements you can trust", "Automated T+1 settlements, reconciliation and dispute handling with full audit trails."],
    ["chart-pie", "Insights that retain merchants", "Spot churn, surface cross‑sell and reward loyal merchants with built‑in analytics."],
    ["radio", "Soundbox confirmations", "Instant multilingual audio alerts so merchants never miss a payment."],
    ["shield-check", "Bank‑grade & compliant", "PCI‑DSS, ISO 27001 and RBI‑aligned, deployed in your environment."],
  ];
  return (
    <section style={{ padding: "84px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
          <h2 style={{ font: "900 40px/1.12 var(--font-sans)", color: "var(--forest-oak)", letterSpacing: "-.02em", margin: "0 0 16px" }}>One stack for the entire merchant lifecycle</h2>
          <p style={{ font: "400 17px/1.5 var(--font-sans)", color: "var(--color-text-secondary)", margin: 0 }}>From the first QR sticker to long‑term loyalty — everything your bank needs to win small business.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {F.map(([ic, t, s]) => (
            <div key={t} style={{ background: "#fff", border: "1px solid var(--color-border-secondary)", borderRadius: 16, padding: 26, boxShadow: "var(--shadow-sm)" }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--mint-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <Icon name={ic} size={22} color="var(--mint-700)" /></span>
              <h3 style={{ font: "700 18px/1.3 var(--font-sans)", color: "var(--color-text)", margin: "0 0 8px" }}>{t}</h3>
              <p style={{ font: "400 14px/1.55 var(--font-sans)", color: "var(--color-text-tertiary)", margin: 0 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section style={{ padding: "20px 24px 84px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", background: "var(--forest-ink)", borderRadius: 24, padding: "56px 40px",
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
        {[["1M+", "Merchants onboarded"], ["₹8,000 Cr+", "Processed annually"], ["30+", "Bank partners"], ["4", "Countries live"]].map(([v, k]) => (
          <div key={k} style={{ textAlign: "center" }}>
            <div style={{ font: "900 42px/1 var(--font-sans)", color: "var(--mint)", letterSpacing: "-.02em" }}>{v}</div>
            <div style={{ font: "400 14px/1.3 var(--font-sans)", color: "rgba(255,255,255,.7)", marginTop: 10 }}>{k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section style={{ padding: "0 24px 84px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", background: "linear-gradient(120deg,var(--mint-tint),#fff)",
        border: "1px solid var(--mint-200)", borderRadius: 24, padding: "60px 40px", textAlign: "center" }}>
        <h2 style={{ font: "900 38px/1.15 var(--font-sans)", color: "var(--forest-oak)", letterSpacing: "-.02em", margin: "0 0 14px" }}>Ready to grow your merchant book?</h2>
        <p style={{ font: "400 17px/1.5 var(--font-sans)", color: "var(--color-text-secondary)", margin: "0 auto 28px", maxWidth: 480 }}>See how leading banks use Mintoak to onboard and retain small merchants at scale.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <CTA size="lg" icon="arrow-right">Book a demo</CTA>
          <CTA size="lg" variant="ghost">Talk to sales</CTA>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ["Products", ["Merchant App", "Soundbox", "Bank CRM", "Analytics", "Rewards"]],
    ["Solutions", ["For banks", "For PSPs", "Acquiring", "Merchant lending"]],
    ["Company", ["About", "Careers", "Newsroom", "Contact"]],
    ["Resources", ["Docs", "Case studies", "Security", "Status"]],
  ];
  return (
    <footer style={{ background: "var(--forest-ink)", padding: "60px 24px 36px", color: "#fff" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr repeat(4,1fr)", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img src="../../assets/logo/mintoak-horizontal-white.svg" height="28" />
          </div>
          <p style={{ font: "400 13px/1.6 var(--font-sans)", color: "rgba(255,255,255,.55)", maxWidth: 240, margin: 0 }}>The merchant payments platform banks grow with.</p>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ font: "700 13px/1 var(--font-sans)", color: "#fff", marginBottom: 16 }}>{h}</div>
            {items.map(i => <div key={i} style={{ font: "400 13px/1 var(--font-sans)", color: "rgba(255,255,255,.6)", marginBottom: 12, cursor: "pointer" }}>{i}</div>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1180, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.1)",
        display: "flex", alignItems: "center", font: "400 12px/1 var(--font-sans)", color: "rgba(255,255,255,.45)" }}>
        <span>© 2026 Mintoak. All rights reserved.</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 20 }}><span>Privacy</span><span>Terms</span><span>Security</span></span>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "#fff" }}>
      <Nav /><Hero /><Trust /><Features /><Stats /><CTASection /><Footer />
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
