// Mintoak Merchant App — mobile UI kit. Single-file React prototype.
const { useState, useEffect, useRef } = React;

function Icon({ name, size = 22, color = "currentColor", sw = 1.75, style }) {
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

const money = n => "₹ " + n.toLocaleString("en-IN");

const TXNS = [
  { id: 1, who: "UPI · Google Pay", amt: 1240, t: "9:42 AM", st: "ok", ic: "smartphone" },
  { id: 2, who: "QR · PhonePe", amt: 560, t: "9:18 AM", st: "ok", ic: "qr-code" },
  { id: 3, who: "Card · Visa ••21", amt: 3499, t: "8:55 AM", st: "ok", ic: "credit-card" },
  { id: 4, who: "UPI · Paytm", amt: 90, t: "8:40 AM", st: "fail", ic: "smartphone" },
  { id: 5, who: "Soundbox · UPI", amt: 215, t: "8:12 AM", st: "ok", ic: "speaker" },
  { id: 6, who: "QR · BHIM", amt: 1750, t: "Yesterday", st: "ok", ic: "qr-code" },
];

function StatusBar() {
  return (
    <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 22px", font: "600 14px/1 var(--font-sans)", color: "#fff", flex: "none" }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Icon name="signal" size={15} color="#fff" /><Icon name="wifi" size={15} color="#fff" /><Icon name="battery-full" size={18} color="#fff" />
      </span>
    </div>
  );
}

function QuickAction({ ic, label, onClick }) {
  return (
    <button onClick={onClick} style={{ border: "none", background: "transparent", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
      <span style={{ width: 52, height: 52, borderRadius: 16, background: "var(--mint-tint)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={ic} size={22} color="var(--mint-700)" />
      </span>
      <span style={{ font: "400 11px/1 var(--font-sans)", color: "var(--color-text-secondary)" }}>{label}</span>
    </button>
  );
}

function TxnRow({ t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
      borderBottom: "1px solid var(--color-border-secondary)" }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, flex: "none",
        background: t.st === "fail" ? "var(--color-error-bg)" : "var(--neutral-100)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={t.ic} size={19} color={t.st === "fail" ? "var(--color-error)" : "var(--color-text-secondary)"} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 14px/1.2 var(--font-sans)", color: "var(--color-text)" }}>{t.who}</div>
        <div style={{ font: "400 12px/1.2 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 2 }}>{t.t}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ font: "700 14px/1 var(--font-sans)", color: t.st === "fail" ? "var(--color-text-tertiary)" : "var(--forest-oak)",
          textDecoration: t.st === "fail" ? "line-through" : "none" }}>{money(t.amt)}</div>
        {t.st === "fail" && <div style={{ font: "500 10px/1 var(--font-sans)", color: "var(--color-error)", marginTop: 3 }}>Failed</div>}
      </div>
    </div>
  );
}

function Home({ go }) {
  return (
    <div style={{ padding: "0 0 16px" }}>
      <div style={{ background: "var(--forest-ink)", padding: "8px 20px 26px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.1)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="store" size={19} color="var(--mint)" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ font: "400 12px/1 var(--font-sans)", color: "rgba(255,255,255,.6)" }}>Good morning</div>
            <div style={{ font: "700 15px/1.2 var(--font-sans)", color: "#fff", marginTop: 3 }}>Sunrise Traders</div>
          </div>
          <Icon name="bell" size={22} color="rgba(255,255,255,.8)" />
        </div>
        <div style={{ font: "400 13px/1 var(--font-sans)", color: "rgba(255,255,255,.65)" }}>Today's collection</div>
        <div style={{ font: "700 38px/1.1 var(--font-sans)", color: "#fff", margin: "8px 0 4px", letterSpacing: "-.01em" }}>{money(42155)}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(128,195,65,.18)",
          color: "var(--mint)", borderRadius: 999, padding: "4px 10px", font: "600 12px/1 var(--font-sans)" }}>
          <Icon name="trending-up" size={13} color="var(--mint)" /> +18% vs yesterday · 34 payments
        </div>
      </div>

      <div style={{ background: "#fff", margin: "-14px 16px 0", borderRadius: 16, boxShadow: "var(--shadow-md)",
        padding: "18px 8px", display: "flex" }}>
        <QuickAction ic="qr-code" label="Collect" onClick={() => go("pay")} />
        <QuickAction ic="indian-rupee" label="Enter amount" onClick={() => go("pay")} />
        <QuickAction ic="rotate-ccw" label="Refund" />
        <QuickAction ic="file-text" label="Reports" onClick={() => go("settle")} />
      </div>

      <div style={{ padding: "22px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <span style={{ font: "700 16px/1 var(--font-sans)", color: "var(--color-text)" }}>Recent payments</span>
          <button onClick={() => go("txns")} style={{ marginLeft: "auto", border: "none", background: "none",
            font: "600 13px/1 var(--font-sans)", color: "var(--mint-700)", cursor: "pointer" }}>See all</button>
        </div>
        {TXNS.slice(0, 4).map(t => <TxnRow key={t.id} t={t} />)}
      </div>
    </div>
  );
}

function Txns() {
  const [tab, setTab] = useState("All");
  return (
    <div>
      <ScreenHead title="Transactions" />
      <div style={{ display: "flex", gap: 8, padding: "0 20px 12px" }}>
        {["All", "UPI", "Card", "Failed"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ border: "none", cursor: "pointer",
            font: "600 13px/1 var(--font-sans)", padding: "7px 14px", borderRadius: 999,
            background: tab === t ? "var(--mint)" : "var(--neutral-100)", color: tab === t ? "#1C1C1C" : "var(--color-text-secondary)" }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        {TXNS.filter(t => tab === "All" || (tab === "Failed" ? t.st === "fail" : t.who.includes(tab))).map(t => <TxnRow key={t.id} t={t} />)}
      </div>
    </div>
  );
}

function Pay({ go }) {
  const [amt, setAmt] = useState("1,240");
  const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  const [done, setDone] = useState(false);
  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 18, padding: 30 }}>
      <span style={{ width: 84, height: 84, borderRadius: 999, background: "var(--mint-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={40} color="var(--mint-700)" />
      </span>
      <div style={{ font: "700 22px/1.2 var(--font-sans)", color: "var(--forest-oak)" }}>Payment received</div>
      <div style={{ font: "700 30px/1 var(--font-sans)", color: "var(--color-text)" }}>{money(1240)}</div>
      <div style={{ font: "400 13px/1.4 var(--font-sans)", color: "var(--color-text-tertiary)", textAlign: "center" }}>Credited via UPI · ref #MTK4821QF<br/>Settlement on T+1 to HDFC ••4521</div>
      <button onClick={() => go("home")} style={{ marginTop: 8, border: "none", background: "var(--mint)", color: "#1C1C1C",
        font: "700 15px/1 var(--font-sans)", padding: "13px 28px", borderRadius: 14, cursor: "pointer" }}>Done</button>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ScreenHead title="Collect payment" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span style={{ font: "400 13px/1 var(--font-sans)", color: "var(--color-text-tertiary)" }}>Amount to collect</span>
        <div style={{ font: "700 46px/1 var(--font-sans)", color: "var(--forest-oak)", letterSpacing: "-.02em" }}>₹ {amt}</div>
        <div style={{ display: "inline-flex", gap: 8, marginTop: 6 }}>
          <Badge>UPI</Badge><Badge>QR</Badge><Badge>Soundbox</Badge>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, padding: "0 14px" }}>
        {keys.map(k => (
          <button key={k} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "16px 0",
            font: "600 22px/1 var(--font-sans)", color: "var(--color-text)" }}>{k}</button>
        ))}
      </div>
      <div style={{ padding: "8px 16px 18px" }}>
        <button onClick={() => setDone(true)} style={{ width: "100%", border: "none", background: "var(--mint)", color: "#1C1C1C",
          font: "700 16px/1 var(--font-sans)", padding: "15px 0", borderRadius: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Icon name="qr-code" size={20} /> Show QR to customer
        </button>
      </div>
    </div>
  );
}

function Settle() {
  return (
    <div>
      <ScreenHead title="Settlements" />
      <div style={{ padding: "0 20px" }}>
        <div style={{ background: "var(--mint-tint)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ font: "400 13px/1 var(--font-sans)", color: "var(--mint-800)" }}>Next settlement</div>
          <div style={{ font: "700 30px/1.1 var(--font-sans)", color: "var(--forest-oak)", margin: "8px 0 4px" }}>{money(61240)}</div>
          <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--mint-800)" }}>Today, 6:00 PM · HDFC ••4521</div>
        </div>
        {[["Yesterday", 48200, "Settled"], ["28 May", 52100, "Settled"], ["27 May", 39850, "Settled"]].map(([d, a, s], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border-secondary)" }}>
            <div>
              <div style={{ font: "700 14px/1.2 var(--font-sans)", color: "var(--color-text)" }}>{money(a)}</div>
              <div style={{ font: "400 12px/1.2 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 2 }}>{d} · T+1</div>
            </div>
            <span style={{ marginLeft: "auto" }}><Badge tone="success" dot>{s}</Badge></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div>
      <ScreenHead title="Profile" />
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0 20px" }}>
          <span style={{ width: 60, height: 60, borderRadius: 18, background: "var(--mint)", color: "#1C1C1C",
            font: "700 22px/1 var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center" }}>ST</span>
          <div>
            <div style={{ font: "700 18px/1.2 var(--font-sans)", color: "var(--forest-oak)" }}>Sunrise Traders</div>
            <div style={{ font: "400 13px/1.2 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 3 }}>sunrise@hdfcbank · Pune</div>
          </div>
        </div>
        {[["building-2", "Business details"], ["landmark", "Bank & settlement"], ["qr-code", "My QR & soundbox"], ["bell", "Notifications"], ["shield-check", "KYC & documents"], ["circle-help", "Help & support"]].map(([ic, l], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: "1px solid var(--color-border-secondary)" }}>
            <Icon name={ic} size={20} color="var(--color-text-secondary)" />
            <span style={{ font: "500 14px/1 var(--font-sans)", color: "var(--color-text)" }}>{l}</span>
            <Icon name="chevron-right" size={18} color="var(--neutral-400)" style={{ marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, tone = "mint", dot }) {
  const map = { mint: ["var(--mint-tint)", "var(--mint-800)"], success: ["var(--color-success-bg)", "var(--color-success)"] };
  const [bg, fg] = map[tone];
  return <span style={{ font: "600 11px/1 var(--font-sans)", padding: "4px 9px", borderRadius: 999, background: bg, color: fg,
    display: "inline-flex", alignItems: "center", gap: 5 }}>{dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: fg }} />}{children}</span>;
}

function ScreenHead({ title }) {
  return <div style={{ padding: "14px 20px 14px", font: "700 20px/1 var(--font-sans)", color: "var(--forest-oak)" }}>{title}</div>;
}

const NAV = [
  { id: "home", label: "Dashboard", ic: "house" },
  { id: "txns", label: "Transactions", ic: "arrow-left-right" },
  { id: "pay", label: "Payment", ic: "indian-rupee", center: true },
  { id: "settle", label: "Settlement", ic: "banknote" },
  { id: "profile", label: "Profile", ic: "user" },
];

function BottomNav({ route, go }) {
  return (
    <div style={{ flex: "none", background: "#fff", borderTop: "1px solid var(--color-border-secondary)",
      display: "flex", alignItems: "flex-end", padding: "8px 8px 22px", position: "relative" }}>
      {NAV.map(n => {
        const active = route === n.id;
        if (n.center) return (
          <div key={n.id} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <button onClick={() => go(n.id)} style={{ width: 58, height: 58, borderRadius: 999, border: "4px solid #fff",
              background: "var(--mint)", boxShadow: "var(--shadow-lg)", cursor: "pointer", marginTop: -34,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={n.ic} size={26} color="#1C1C1C" />
            </button>
          </div>
        );
        return (
          <button key={n.id} onClick={() => go(n.id)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", paddingTop: 8 }}>
            {active && <span style={{ position: "absolute", top: 0, width: 26, height: 3, borderRadius: 999, background: "var(--mint)" }} />}
            <Icon name={n.ic} size={21} color={active ? "var(--mint-700)" : "var(--neutral-500)"} />
            <span style={{ font: `${active ? 600 : 400} 10px/1 var(--font-sans)`, color: active ? "var(--mint-700)" : "var(--neutral-500)" }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [route, setRoute] = useState("home");
  const dark = route === "home";
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--color-bg-layout)", padding: 24, fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 390, height: 844, background: "#fff", borderRadius: 44, overflow: "hidden",
        boxShadow: "0 40px 80px -20px rgba(0,0,0,.35), 0 0 0 11px #11140f, 0 0 0 13px #2b2f27",
        display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ background: dark ? "var(--forest-ink)" : "#fff", flex: "none" }}>
          {dark ? <StatusBar /> : <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", font: "600 14px/1 var(--font-sans)", color: "var(--color-text)" }}><span>9:41</span><span style={{ display: "flex", gap: 6 }}><Icon name="signal" size={15} color="var(--color-text)" /><Icon name="wifi" size={15} color="var(--color-text)" /><Icon name="battery-full" size={18} color="var(--color-text)" /></span></div>}
        </div>
        <div style={{ flex: 1, overflow: "auto", background: route === "home" ? "var(--forest-ink)" : "#fff" }}>
          <div style={{ background: "#fff", minHeight: route === "home" ? 0 : "100%", borderRadius: route === "home" ? 0 : 0 }}>
            {route === "home" && <Home go={setRoute} />}
            {route === "txns" && <Txns />}
            {route === "pay" && <Pay go={setRoute} />}
            {route === "settle" && <Settle />}
            {route === "profile" && <Profile />}
          </div>
        </div>
        <BottomNav route={route} go={setRoute} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
