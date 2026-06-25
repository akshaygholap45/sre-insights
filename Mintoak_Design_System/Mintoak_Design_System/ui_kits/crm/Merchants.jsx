const MERCHANTS = [
  { id: 1, name: "Sunrise Traders", cat: "Retail · Grocery", in: "ST", status: ["success", "Active"], vol: "₹ 8,42,100", txn: "2 min ago", rm: "Priya S.", upi: "sunrise@hdfcbank", city: "Pune", since: "Mar 2024" },
  { id: 2, name: "Café Mocha", cat: "F&B · Café", in: "CM", status: ["success", "Active"], vol: "₹ 3,18,500", txn: "12 min ago", rm: "Priya S.", upi: "cafemocha@hdfcbank", city: "Mumbai", since: "Jan 2024" },
  { id: 3, name: "Verma Electronics", cat: "Retail · Electronics", in: "VE", status: ["warning", "KYC due"], vol: "₹ 12,90,400", txn: "1 hr ago", rm: "Arjun M.", upi: "verma@hdfcbank", city: "Delhi", since: "Nov 2023" },
  { id: 4, name: "GreenLeaf Pharmacy", cat: "Healthcare · Pharmacy", in: "GP", status: ["success", "Active"], vol: "₹ 5,67,200", txn: "3 hr ago", rm: "Priya S.", upi: "greenleaf@hdfcbank", city: "Pune", since: "Feb 2024" },
  { id: 5, name: "Apex Hardware", cat: "Retail · Hardware", in: "AH", status: ["error", "Suspended"], vol: "₹ 0", txn: "6 days ago", rm: "Arjun M.", upi: "apex@hdfcbank", city: "Nagpur", since: "Dec 2023" },
  { id: 6, name: "Bloom Florist", cat: "Retail · Gifts", in: "BF", status: ["success", "Active"], vol: "₹ 1,04,800", txn: "Yesterday", rm: "Priya S.", upi: "bloom@hdfcbank", city: "Mumbai", since: "Apr 2024" },
];

function Th({ children, w }) {
  return <th style={{ font: "600 12px/1 var(--font-sans)", color: "var(--color-text-tertiary)", textAlign: "left",
    padding: "0 16px 12px", width: w, textTransform: "none" }}>{children}</th>;
}

function Detail({ m, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(20,20,20,.32)", display: "flex",
      justifyContent: "flex-end", zIndex: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, background: "#fff", height: "100%",
        boxShadow: "var(--shadow-xl)", display: "flex", flexDirection: "column", animation: "slideIn .2s ease" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-secondary)",
          display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar initials={m.in} size={46} />
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 18px/1.2 var(--font-sans)", color: "var(--forest-oak)" }}>{m.name}</div>
            <div style={{ font: "400 12px/1.2 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 3 }}>{m.cat}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "var(--neutral-100)", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={18} color="var(--color-text-secondary)" />
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 22, overflow: "auto" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Badge tone={m.status[0]} dot>{m.status[1]}</Badge>
            <Badge tone="mint">UPI</Badge>
            <Badge tone="neutral">QR · Soundbox</Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["Volume (MTD)", m.vol], ["Last transaction", m.txn], ["VPA", m.upi], ["City", m.city],
              ["Relationship mgr", m.rm], ["Onboarded", m.since]].map(([k, v]) => (
              <div key={k}>
                <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--color-text-tertiary)", marginBottom: 6 }}>{k}</div>
                <div style={{ font: "500 14px/1.2 var(--font-sans)", color: "var(--color-text)" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--mint-tint)", borderRadius: 10, padding: 16 }}>
            <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--forest-oak)", marginBottom: 4 }}>Settlement account</div>
            <div style={{ font: "400 13px/1.4 var(--font-sans)", color: "var(--color-text-secondary)" }}>HDFC Bank ••4521 · Daily T+1</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" icon="message-square" full>Contact</Button>
            <Button variant="neutral" icon="file-text" full>Statement</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Merchants() {
  const [sel, setSel] = React.useState(null);
  const [q, setQ] = React.useState("");
  const rows = MERCHANTS.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ font: "700 24px/1.2 var(--font-sans)", color: "var(--forest-oak)", margin: 0 }}>Merchants</h1>
          <p style={{ font: "400 14px/1.4 var(--font-sans)", color: "var(--color-text-tertiary)", margin: "6px 0 0" }}>
            1,284 active across your portfolio.</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Button variant="neutral" icon="sliders-horizontal">Filters</Button>
          <Button variant="primary" icon="plus">Add merchant</Button>
        </div>
      </div>
      <Card pad={0}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--color-border-secondary)", display: "flex", gap: 12 }}>
          <Input icon="search" placeholder="Search merchants…" value={q} onChange={setQ} style={{ width: 280 }} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <Th w="28%">Merchant</Th><Th>Status</Th><Th>Volume (MTD)</Th><Th>Last txn</Th><Th>RM</Th>
          </tr></thead>
          <tbody>
            {rows.map(m => (
              <Row key={m.id} m={m} onClick={() => setSel(m)} />
            ))}
          </tbody>
        </table>
      </Card>
      {sel && <Detail m={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function Row({ m, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <tr onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ borderTop: "1px solid var(--color-border-secondary)", cursor: "pointer",
        background: h ? "var(--neutral-50)" : "transparent" }}>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={m.in} size={36} />
          <div>
            <div style={{ font: "600 14px/1.2 var(--font-sans)", color: "var(--color-text)" }}>{m.name}</div>
            <div style={{ font: "400 12px/1.2 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 2 }}>{m.cat}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 16px" }}><Badge tone={m.status[0]} dot>{m.status[1]}</Badge></td>
      <td style={{ padding: "14px 16px", font: "600 14px/1 var(--font-sans)", color: "var(--color-text)" }}>{m.vol}</td>
      <td style={{ padding: "14px 16px", font: "400 13px/1 var(--font-sans)", color: "var(--color-text-secondary)" }}>{m.txn}</td>
      <td style={{ padding: "14px 16px", font: "400 13px/1 var(--font-sans)", color: "var(--color-text-secondary)" }}>{m.rm}</td>
    </tr>
  );
}

Object.assign(window, { Merchants });
