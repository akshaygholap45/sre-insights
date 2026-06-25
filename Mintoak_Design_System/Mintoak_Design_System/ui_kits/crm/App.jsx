const CRUMBS = {
  dashboard: ["Home", "Dashboard"], merchants: ["Home", "Merchants"],
  transactions: ["Home", "Transactions"], settlements: ["Home", "Settlements"],
  reports: ["Home", "Reports"], settings: ["Home", "Settings"], help: ["Home", "Help & support"],
};

function Placeholder({ route }) {
  const map = {
    transactions: ["arrow-left-right", "Transactions", "Every UPI, card and QR payment across your merchants, in real time."],
    settlements: ["banknote", "Settlements", "Track T+1 settlement batches and bank credits."],
    reports: ["chart-pie", "Reports", "Portfolio analytics, MDR reports and merchant cohorts."],
    settings: ["settings", "Settings", "Team, roles, branch mapping and notification preferences."],
    help: ["life-buoy", "Help & support", "Guides, contact your Mintoak partner team."],
  };
  const [ic, title, sub] = map[route] || map.reports;
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <h1 style={{ font: "700 24px/1.2 var(--font-sans)", color: "var(--forest-oak)", margin: "0 0 24px" }}>{title}</h1>
      <Card pad={56}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
          <span style={{ width: 64, height: 64, borderRadius: 16, background: "var(--mint-tint)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={ic} size={28} color="var(--mint-700)" />
          </span>
          <div style={{ font: "600 17px/1.2 var(--font-sans)", color: "var(--color-text)" }}>{title}</div>
          <div style={{ font: "400 14px/1.5 var(--font-sans)", color: "var(--color-text-tertiary)", maxWidth: 360 }}>{sub}</div>
          <Button variant="ghost" icon="arrow-right" style={{ marginTop: 4 }}>Explore</Button>
        </div>
      </Card>
    </div>
  );
}

function App() {
  const [route, setRoute] = React.useState("dashboard");
  const action = <Button variant="deep" size="sm" icon="zap">Quick pay</Button>;
  return (
    <Shell route={route} setRoute={setRoute} crumbs={CRUMBS[route]} action={action}>
      {route === "dashboard" && <Dashboard goMerchants={() => setRoute("merchants")} />}
      {route === "merchants" && <Merchants />}
      {!["dashboard", "merchants"].includes(route) && <Placeholder route={route} />}
    </Shell>
  );
}

Object.assign(window, { App });
