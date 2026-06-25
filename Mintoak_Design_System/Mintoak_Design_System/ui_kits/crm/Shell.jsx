const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "merchants", label: "Merchants", icon: "store" },
  { id: "transactions", label: "Transactions", icon: "arrow-left-right" },
  { id: "settlements", label: "Settlements", icon: "banknote" },
  { id: "reports", label: "Reports", icon: "chart-pie" },
];
const NAV2 = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "help", label: "Help & support", icon: "life-buoy" },
];

function SideItem({ item, active, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
        font: "500 14px/1 var(--font-sans)",
        background: active ? "var(--mint-tint)" : h ? "var(--neutral-100)" : "transparent",
        color: active ? "var(--mint-800)" : "var(--color-text-secondary)", transition: "all .15s" }}>
      <Icon name={item.icon} size={18} color={active ? "var(--mint-700)" : "var(--neutral-500)"} />
      {item.label}
    </button>
  );
}

function Sidebar({ route, setRoute }) {
  return (
    <aside style={{ width: 248, background: "#fff", borderRight: "1px solid var(--color-border-secondary)", display: "flex", flexDirection: "column",
      padding: 16, flex: "none", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 18px" }}>
        <img src="../../assets/logo/mintoak-horizontal-green.svg" height="26" />
        <span style={{ font: "600 10px/1 var(--font-sans)", color: "var(--mint-800)", background: "var(--mint-tint)",
          padding: "3px 6px", borderRadius: 4, marginLeft: 2 }}>CRM</span>
      </div>
      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--color-text-tertiary)", letterSpacing: ".04em",
        padding: "8px 12px 6px", textTransform: "uppercase" }}>Platform</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(n => <SideItem key={n.id} item={n} active={route === n.id} onClick={() => setRoute(n.id)} />)}
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV2.map(n => <SideItem key={n.id} item={n} active={route === n.id} onClick={() => setRoute(n.id)} />)}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 8px 4px", marginTop: 8,
          borderTop: "1px solid var(--color-border-secondary)" }}>
          <Avatar initials="PS" size={34} />
          <div style={{ lineHeight: 1.3, overflow: "hidden" }}>
            <div style={{ font: "600 13px/1.2 var(--font-sans)", color: "var(--color-text)" }}>Priya Shah</div>
            <div style={{ font: "400 11px/1.2 var(--font-sans)", color: "var(--color-text-tertiary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>RM · HDFC Bank</div>
          </div>
          <Icon name="chevrons-up-down" size={16} color="var(--neutral-400)" />
        </div>
      </div>
    </aside>
  );
}

function Header({ crumbs, action }) {
  return (
    <header style={{ height: 64, background: "#fff", borderBottom: "1px solid var(--color-border-secondary)",
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flex: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={16} color="var(--neutral-400)" />}
            <span style={{ font: `${i === crumbs.length - 1 ? 600 : 400} 13px/1 var(--font-sans)`,
              color: i === crumbs.length - 1 ? "var(--color-text)" : "var(--color-text-tertiary)" }}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--neutral-100)",
          borderRadius: 8, padding: "7px 12px", width: 220 }}>
          <Icon name="search" size={16} color="var(--neutral-500)" />
          <span style={{ font: "400 13px/1 var(--font-sans)", color: "var(--neutral-500)" }}>Search merchants…</span>
          <span style={{ marginLeft: "auto", font: "500 11px/1 var(--font-mono)", color: "var(--neutral-400)",
            border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 5px" }}>⌘K</span>
        </span>
        <span style={{ position: "relative", display: "inline-flex" }}>
          <Icon name="bell" size={20} color="var(--color-text-secondary)" />
          <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999,
            background: "var(--color-error)", border: "2px solid #fff" }} />
        </span>
        {action}
        <Avatar initials="PS" size={34} ring />
      </div>
    </header>
  );
}

function Shell({ route, setRoute, crumbs, action, children }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--color-bg-layout)", overflow: "hidden" }}>
      <Sidebar route={route} setRoute={setRoute} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header crumbs={crumbs} action={action} />
        <main style={{ flex: 1, overflow: "auto", padding: 28 }}>{children}</main>
      </div>
    </div>
  );
}

Object.assign(window, { Shell, NAV });
