const { useEffect, useRef, useState } = React;

// Lucide icon — renders an <i> and lets lucide.createIcons() swap in the SVG
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.75, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: { width: size, height: size, stroke: color, "stroke-width": strokeWidth },
        nameAttr: "data-lucide",
      });
    }
  }, [name, size, color, strokeWidth]);
  return <span ref={ref} style={{ display: "inline-flex", width: size, height: size, ...style }} />;
}

function Button({ children, variant = "primary", size = "md", icon, iconRight, onClick, full, style }) {
  const pad = size === "sm" ? "5px 12px" : size === "lg" ? "11px 20px" : "8px 16px";
  const fs = size === "sm" ? 12 : size === "lg" ? 16 : 14;
  const variants = {
    primary: { background: "var(--mint)", color: "#1C1C1C", border: "1px solid transparent" },
    deep:    { background: "var(--mint-deep)", color: "#fff", border: "1px solid transparent" },
    ghost:   { background: "#fff", color: "var(--mint-700)", border: "1px solid var(--mint-500)" },
    neutral: { background: "#fff", color: "var(--color-text)", border: "1px solid var(--color-border)" },
    text:    { background: "transparent", color: "var(--mint-700)", border: "1px solid transparent" },
    danger:  { background: "var(--color-error)", color: "#fff", border: "1px solid transparent" },
  };
  const [hover, setHover] = useState(false);
  const hov = {
    primary: { background: "var(--mint-600)" }, deep: { background: "var(--mint-800)" },
    ghost: { background: "var(--mint-tint)" }, neutral: { background: "var(--neutral-50)" },
    text: { background: "var(--mint-tint)" }, danger: { background: "#b91c1c" },
  };
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        font: `500 ${fs}px/1.3 var(--font-sans)`, padding: pad, borderRadius: 12, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        width: full ? "100%" : "auto", transition: "background .15s ease", whiteSpace: "nowrap",
        ...variants[variant], ...(hover ? hov[variant] : {}), ...style,
      }}>
      {icon && <Icon name={icon} size={fs + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fs + 2} />}
    </button>
  );
}

const badgeMap = {
  success: ["var(--color-success-bg)", "var(--color-success)"],
  warning: ["var(--color-warning-bg)", "var(--color-warning)"],
  error:   ["var(--color-error-bg)", "var(--color-error)"],
  info:    ["var(--color-info-bg)", "var(--color-info)"],
  mint:    ["var(--mint-tint)", "var(--mint-800)"],
  neutral: ["var(--neutral-100)", "var(--color-text-secondary)"],
};
function Badge({ children, tone = "neutral", dot }) {
  const [bg, fg] = badgeMap[tone] || badgeMap.neutral;
  return (
    <span style={{ font: "500 12px/1 var(--font-sans)", padding: "4px 10px", borderRadius: 999,
      background: bg, color: fg, display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} />}
      {children}
    </span>
  );
}

function Avatar({ initials, size = 32, src, ring }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 999, background: src ? "none" : "var(--mint)",
      color: "#1C1C1C", font: `600 ${size * 0.4}px/1 var(--font-sans)`, display: "inline-flex",
      alignItems: "center", justifyContent: "center", flex: "none", overflow: "hidden",
      boxShadow: ring ? "0 0 0 2px #fff, 0 0 0 4px var(--mint-300)" : "none" }}>
      {src ? <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </span>
  );
}

function Input({ label, value, onChange, placeholder, icon, hint, error, disabled, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--color-text-secondary)" }}>{label}</span>}
      <span style={{ display: "flex", alignItems: "center", gap: 8, background: disabled ? "var(--neutral-100)" : "#fff",
        border: `1px solid ${error ? "var(--color-error)" : focus ? "var(--mint-600)" : "var(--color-border)"}`,
        borderRadius: 6, padding: "0 12px", boxShadow: focus ? "0 0 0 3px rgba(128,195,65,.2)" : "none", transition: "all .15s" }}>
        {icon && <Icon name={icon} size={16} color="var(--neutral-500)" />}
        <input value={value} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ border: "none", outline: "none", background: "transparent", font: "400 14px/1 var(--font-sans)",
            color: "var(--color-text)", padding: "9px 0", width: "100%" }} />
      </span>
      {hint && <span style={{ font: "400 11px/1.3 var(--font-sans)", color: error ? "var(--color-error)" : "var(--color-text-tertiary)" }}>{hint}</span>}
    </label>
  );
}

function Card({ children, style, pad = 20, onClick, hover }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: "#fff", border: "1px solid var(--color-border-secondary)", borderRadius: 12,
        boxShadow: hover && h ? "var(--shadow-md)" : "var(--shadow-sm)", padding: pad,
        cursor: onClick ? "pointer" : "default", transition: "box-shadow .15s", ...style }}>
      {children}
    </div>
  );
}

Object.assign(window, { Icon, Button, Badge, Avatar, Input, Card });
