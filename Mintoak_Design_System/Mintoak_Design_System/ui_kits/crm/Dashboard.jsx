const STATS = [
  { k: "Total volume", v: "₹ 4.82 Cr", d: "+12.4%", up: true, icon: "trending-up", sub: "vs last month" },
  { k: "Active merchants", v: "1,284", d: "+38", up: true, icon: "store", sub: "this month" },
  { k: "Settlements due", v: "₹ 6.1 L", d: "23 merchants", up: null, icon: "banknote", sub: "by 6 PM" },
  { k: "Failed txns", v: "0.4%", d: "−0.1%", up: false, icon: "circle-alert", sub: "below target" },
];
const BARS = [
  ["Mon", 62], ["Tue", 78], ["Wed", 54], ["Thu", 90], ["Fri", 84], ["Sat", 100], ["Sun", 48],
];
const FEED = [
  { ic: "user-plus", t: "Sunrise Traders onboarded", s: "KYC verified · 2h ago", tone: "mint" },
  { ic: "check-check", t: "Settlement of ₹4,82,300 completed", s: "HDFC ••4521 · 3h ago", tone: "success" },
  { ic: "triangle-alert", t: "3 merchants need re-KYC", s: "Expiring this week · 5h ago", tone: "warning" },
  { ic: "arrow-left-right", t: "1,204 transactions processed", s: "Today · live", tone: "info" },
];

function StatCard({ s }) {
  const tone = s.up === null ? "var(--color-text-tertiary)" : s.up ? "var(--color-success)" : "var(--color-success)";
  return (
    <Card pad={18}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--color-text-tertiary)" }}>{s.k}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mint-tint)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={s.icon} size={17} color="var(--mint-700)" />
        </span>
      </div>
      <div style={{ font: "700 26px/1.1 var(--font-sans)", color: "var(--forest-oak)", margin: "12px 0 4px" }}>{s.v}</div>
      <div style={{ font: "500 12px/1 var(--font-sans)", color: tone }}>
        {s.d} <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>· {s.sub}</span>
      </div>
    </Card>
  );
}

function Dashboard({ goMerchants }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ font: "700 24px/1.2 var(--font-sans)", color: "var(--forest-oak)", margin: 0 }}>Good morning, Priya</h1>
          <p style={{ font: "400 14px/1.4 var(--font-sans)", color: "var(--color-text-tertiary)", margin: "6px 0 0" }}>
            Here's what's happening across your portfolio today.</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Button variant="neutral" icon="calendar">Last 7 days</Button>
          <Button variant="primary" icon="plus" onClick={goMerchants}>Add merchant</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
        {STATS.map((s, i) => <StatCard key={i} s={s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card pad={22}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ font: "600 15px/1 var(--font-sans)", margin: 0, color: "var(--color-text)" }}>Transaction volume</h3>
              <span style={{ font: "400 12px/1 var(--font-sans)", color: "var(--color-text-tertiary)" }}>Daily, this week</span>
            </div>
            <Badge tone="success" dot>+12.4%</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, padding: "0 4px" }}>
            {BARS.map(([d, h], i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", maxWidth: 42, height: `${Math.round(h * 1.6)}px`, borderRadius: "6px 6px 0 0",
                  background: i === 5 ? "var(--mint)" : "var(--mint-200)", transition: "height .3s" }} />
                <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--color-text-tertiary)" }}>{d}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={20}>
          <h3 style={{ font: "600 15px/1 var(--font-sans)", margin: "0 0 16px", color: "var(--color-text)" }}>Recent activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FEED.map((f, i) => {
              const [bg, fg] = (window.badgeColors && window.badgeColors[f.tone]) || ["var(--mint-tint)", "var(--mint-700)"];
              return (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flex: "none", background: bg,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={f.ic} size={15} color={fg} />
                  </span>
                  <div>
                    <div style={{ font: "500 13px/1.35 var(--font-sans)", color: "var(--color-text)" }}>{f.t}</div>
                    <div style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 2 }}>{f.s}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

window.badgeColors = {
  mint: ["var(--mint-tint)", "var(--mint-700)"],
  success: ["var(--color-success-bg)", "var(--color-success)"],
  warning: ["var(--color-warning-bg)", "var(--color-warning)"],
  info: ["var(--color-info-bg)", "var(--color-info)"],
};
Object.assign(window, { Dashboard });
