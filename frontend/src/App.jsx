import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from "@mui/material";
import {
  Add,
  CheckCircle,
  DarkMode,
  Delete,
  Edit,
  ChevronLeft,
  ChevronRight,
  Launch,
  LightMode,
  Menu,
  Refresh,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "./api";
import "./styles.css";

const APP_NAME = "SRE Operational Insights";
const DRAWER_WIDTH = 260;
const COLORS = ["#2563EB", "#0F766E", "#D97706", "#7C3AED", "#DC6B5F", "#4A8B27", "#246915", "#80C341"];
const PRIORITY_COLORS = { P1: "#DC2626", P2: "#D97706", P3: "#2563EB", P4: "#7C3AED", P5: "#4A8B27" };
const STATUS_COLORS = { open: "#2563EB", acknowledged: "#D97706", closed: "#2E7D32" };
const NAV_ITEMS = ["Overview", "Opsgenie Alerts", "Team Task Summary", "Important URLs", "Jira Summary", "On-Call Management", "Shift Handover"];
const SHIFT_OPTIONS = [
  { id: "morning", label: "Morning Shift", startHour: 7, startMinute: 30, endHour: 16, endMinute: 30, endDayOffset: 0 },
  { id: "afternoon", label: "Afternoon Shift", startHour: 15, startMinute: 0, endHour: 0, endMinute: 0, endDayOffset: 1 },
  { id: "night", label: "Night Shift", startHour: 22, startMinute: 30, endHour: 7, endMinute: 30, endDayOffset: 1 },
];
const ROSTER_SHIFT_ROWS = [
  { id: "morning", label: "Morning Shift", colorClass: "shift-morning" },
  { id: "afternoon", label: "Afternoon Shift", colorClass: "shift-afternoon" },
  { id: "night", label: "Night Shift", colorClass: "shift-night" },
  { id: "reserved", label: "Reserved Shift", colorClass: "shift-reserved" },
  { id: "reserved2", label: "Reserved Shift 2", colorClass: "shift-reserved" },
];
const ENGINEER_COLORS = ["#40C4FF", "#FFB74D", "#9FA8DA", "#81C784", "#F48FB1", "#4DB6AC", "#FFD54F", "#90CAF9", "#CE93D8", "#A5D6A7"];
const DEFAULT_URLS = [
  { id: crypto.randomUUID(), title: "Grafana", url: "https://grafana.com", category: "Observability", description: "Metrics and service dashboards" },
  { id: crypto.randomUUID(), title: "Opsgenie", url: "https://app.opsgenie.com", category: "Incident Response", description: "Alerts, schedules, and escalations" },
  { id: crypto.randomUUID(), title: "AWS Console", url: "https://console.aws.amazon.com", category: "Cloud", description: "Infrastructure operations" },
];
const EMPTY_TODO = { title: "", description: "", priority: "Medium", status: "Pending", owner: "", dueDate: "" };
const EMPTY_URL = { title: "", url: "", category: "", description: "" };
const TASK_TABLE_COLUMNS = ["Date", "Client", "Reportee", "Status", "Alert Name", "Summary", "Resolution", "Tracker", "Updates / Remark"];
const EMPTY_TEAM_TASK = {
  Date: todayInputDate(),
  Client: "",
  Reportee: "",
  Status: "Open",
  "Alert Name": "",
  Summary: "",
  Resolution: "",
  Tracker: "",
  "Updates / Remark": "",
};

function getStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatLocalInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function defaultRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return { start: formatLocalInput(start), end: formatLocalInput(end) };
}

function defaultOnCallRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 14);
  end.setHours(23, 59, 0, 0);
  return { start: formatLocalInput(start), end: formatLocalInput(end) };
}

function toApiDate(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function todayInputDate() {
  return formatLocalInput(new Date()).slice(0, 10);
}

function buildShiftRange(dateValue, shiftId) {
  const shift = SHIFT_OPTIONS.find((item) => item.id === shiftId) || SHIFT_OPTIONS[0];
  const [year, month, day] = (dateValue || todayInputDate()).split("-").map(Number);
  const start = new Date(year, month - 1, day, shift.startHour, shift.startMinute, 0, 0);
  const end = new Date(year, month - 1, day + shift.endDayOffset, shift.endHour, shift.endMinute, 0, 0);
  return {
    end: formatLocalInput(end),
    label: `${shift.label} (${formatIst(start)} - ${formatIst(end)})`,
    start: formatLocalInput(start),
  };
}

function formatIst(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

function formatJiraDate(value) {
  return formatIst(value);
}

function dateColumns(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return [];
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const columns = [];
  for (const cursor = new Date(start); cursor <= end && columns.length < 45; cursor.setDate(cursor.getDate() + 1)) {
    columns.push(new Date(cursor));
  }
  return columns;
}

const TIMELINE_HOUR_WIDTH = 44;

function timelineAxis(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    return { start, end, hours: 0, width: 0, days: [] };
  }
  const hours = (end - start) / 3600000;
  const days = dateColumns(startValue, endValue).map((day) => {
    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayEnd.setHours(24, 0, 0, 0);
    const clippedStart = new Date(Math.max(dayStart.getTime(), start.getTime()));
    const clippedEnd = new Date(Math.min(dayEnd.getTime(), end.getTime()));
    return {
      date: day,
      hours: Math.max(0, (clippedEnd - clippedStart) / 3600000),
      startHour: clippedStart.getHours(),
    };
  }).filter((day) => day.hours > 0);
  return { start, end, hours, width: hours * TIMELINE_HOUR_WIDTH, days };
}

function timelineBarStyle(entry, axis) {
  const start = Math.max(new Date(entry.start).getTime(), axis.start.getTime());
  const end = Math.min(new Date(entry.end).getTime(), axis.end.getTime());
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return {
    left: `${((start - axis.start) / 3600000) * TIMELINE_HOUR_WIDTH}px`,
    width: `${Math.max(28, ((end - start) / 3600000) * TIMELINE_HOUR_WIDTH)}px`,
  };
}

function currentTimeStyle(now, axis) {
  if (!axis?.start || !axis?.end || now < axis.start || now > axis.end) return null;
  return {
    left: `${((now - axis.start) / 3600000) * TIMELINE_HOUR_WIDTH}px`,
  };
}

function hashString(value) {
  return String(value || "unknown").split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function engineerColor(value) {
  return ENGINEER_COLORS[Math.abs(hashString(value)) % ENGINEER_COLORS.length];
}

function classifyRosterShift(entry) {
  const label = `${entry.rotation || ""} ${entry.name || ""}`.toLowerCase();
  if (label.includes("reserved") && (label.includes("2") || label.includes("secondary"))) return "reserved2";
  if (label.includes("reserved")) return "reserved";
  if (label.includes("morning")) return "morning";
  if (label.includes("afternoon")) return "afternoon";
  if (label.includes("night")) return "night";

  const start = new Date(entry.start);
  const minutes = start.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).split(":").reduce((total, part, index) => total + Number(part) * (index === 0 ? 60 : 1), 0);

  if (minutes >= 420 && minutes <= 540) return "morning";
  if (minutes >= 870 && minutes <= 960) return "afternoon";
  if (minutes >= 1290 || minutes <= 90) return "night";
  return "reserved";
}

function buildRosterRows(entries) {
  const rows = ROSTER_SHIFT_ROWS.map((shift) => ({ ...shift, entries: [], lanes: 1, height: 92 }));
  const rowMap = Object.fromEntries(rows.map((row) => [row.id, row]));

  entries
    .filter((entry) => entry.start && entry.end)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .forEach((entry) => {
      const row = rowMap[classifyRosterShift(entry)] || rowMap.reserved;
      const start = new Date(entry.start).getTime();
      const end = new Date(entry.end).getTime();
      const lanes = row._laneEnds || [];
      let lane = lanes.findIndex((laneEnd) => start >= laneEnd);
      if (lane === -1) lane = lanes.length;
      lanes[lane] = end;
      row._laneEnds = lanes;
      row.lanes = Math.max(row.lanes, lanes.length);
      row.height = Math.max(92, row.lanes * 68 + 24);
      row.entries.push({ ...entry, lane });
    });

  return rows.filter((row) => row.entries.length).map(({ _laneEnds, ...row }) => row);
}

function dateKey(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatIstTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function shiftDuration(entry) {
  if (!entry.start || !entry.end) return "-";
  const hours = (new Date(entry.end) - new Date(entry.start)) / 3600000;
  return `${Math.round(hours * 10) / 10}h`;
}

function displayEngineer(value) {
  if (!value) return "Unknown";
  return value.includes("@") ? value.split("@")[0].replace(/[._-]+/g, " ") : value;
}

function engineerInitials(value) {
  return displayEngineer(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function istDateLabel(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
  });
}

function parseTaskDate(value) {
  if (!value) return null;
  const [day, month, year] = value.split(/[/-]/).map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function countBy(items, key) {
  const map = items.reduce((acc, item) => {
    const name = item[key] || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, columns, rows) {
  const csv = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function chartByDate(items) {
  return countBy(
    items.map((alert) => ({
      day: istDateLabel(alert.created_at),
    })),
    "day",
  );
}

function buildStackedData(items, dateKey, bucketKey, buckets) {
  const grouped = {};
  items.forEach((item) => {
    const date = istDateLabel(item[dateKey]);
    const bucket = item[bucketKey] || "Unknown";
    grouped[date] = grouped[date] || { name: date };
    grouped[date][bucket] = (grouped[date][bucket] || 0) + 1;
  });
  return Object.values(grouped).map((row) => ({
    ...Object.fromEntries(buckets.map((bucket) => [bucket, row[bucket] || 0])),
    ...row,
  }));
}

function buildAlertsByHour(alerts) {
  const rows = Array.from({ length: 24 }, (_, hour) => ({ name: String(hour).padStart(2, "0"), value: 0 }));
  alerts.forEach((alert) => {
    if (!alert.created_at) return;
    const hour = Number(new Date(alert.created_at).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
    rows[hour].value += 1;
  });
  return rows;
}

function buildAlertsByDayOfWeek(alerts) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = Object.fromEntries(days.map((day) => [day, { name: day, business: 0, offHours: 0 }]));
  alerts.forEach((alert) => {
    if (!alert.created_at) return;
    const day = new Date(alert.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" });
    const hour = Number(new Date(alert.created_at).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
    const key = hour >= 9 && hour <= 18 ? "business" : "offHours";
    if (rows[day]) rows[day][key] += 1;
  });
  return days.map((day) => rows[day]);
}

function topTags(alerts) {
  const rows = [];
  alerts.forEach((alert) => (alert.tags || []).forEach((tag) => rows.push({ tag })));
  return countBy(rows, "tag").sort((a, b) => b.value - a.value).slice(0, 10);
}

function minutesBetween(start, end) {
  if (!start || !end) return null;
  return (new Date(end) - new Date(start)) / 60000;
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (!validValues.length) return 0;
  return Math.round((validValues.reduce((sum, value) => sum + value, 0) / validValues.length) * 100) / 100;
}

function buildSummaryFromAlerts(alerts) {
  return {
    total_alerts: alerts.length,
    open_alerts: alerts.filter((alert) => alert.status === "open").length,
    acknowledged_alerts: alerts.filter((alert) => alert.status === "acknowledged").length,
    closed_alerts: alerts.filter((alert) => alert.status === "closed").length,
    p1_count: alerts.filter((alert) => alert.priority === "P1").length,
    p2_count: alerts.filter((alert) => alert.priority === "P2").length,
    p3_count: alerts.filter((alert) => alert.priority === "P3").length,
    p4_count: alerts.filter((alert) => alert.priority === "P4").length,
    p5_count: alerts.filter((alert) => alert.priority === "P5").length,
    mtta: average(alerts.map((alert) => minutesBetween(alert.created_at, alert.acknowledged_at))),
    mttr: average(alerts.map((alert) => minutesBetween(alert.created_at, alert.closed_at))),
  };
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return {
    ist: now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }),
    utc: now.toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("sre-theme") || "dark");
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStored("sre-sidebar-collapsed", false));
  const [range, setRange] = useState(defaultRange);
  const [appliedRange, setAppliedRange] = useState(defaultRange);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [onCall, setOnCall] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskAnalytics, setTaskAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urls, setUrls] = useState(() => getStored("sre-important-urls", DEFAULT_URLS));
  const [todos, setTodos] = useState(() => getStored("sre-todos", []));
  const clock = useClock();

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#80C341" : "#48821C", dark: "#3A6A1E", contrastText: "#FFFFFF" },
      secondary: { main: "#80C341", dark: "#66A332", contrastText: "#1C1C1C" },
      success: { main: "#2E7D32" },
      warning: { main: "#D97706" },
      error: { main: "#DC2626" },
      info: { main: "#2563EB" },
      background: mode === "dark" ? { default: "#0F1115", paper: "#171A20" } : { default: "#F5F5F5", paper: "#FFFFFF" },
      text: mode === "dark" ? { primary: "#F5F7FA", secondary: "#A8B0BC" } : { primary: "#1C1C1C", secondary: "#636059" },
    },
    typography: {
      fontFamily: "'Lato', -apple-system, 'Segoe UI', system-ui, sans-serif",
      fontSize: 14,
      h4: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.2, letterSpacing: "-0.01em" },
      h5: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700, fontSize: "1rem", lineHeight: 1.5 },
      button: { fontWeight: 700, textTransform: "none" },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCard: { styleOverrides: { root: { backgroundImage: "none", borderRadius: 12 } } },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, boxShadow: "none", minHeight: 36 },
          contained: {
            background: mode === "dark" ? "#80C341" : "#48821C",
            color: mode === "dark" ? "#14210B" : "#FFFFFF",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 700 },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
    },
  }), [mode]);

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  useEffect(() => {
    localStorage.setItem("sre-theme", mode);
    document.body.classList.toggle("mintoak-dark", mode === "dark");
    return () => document.body.classList.remove("mintoak-dark");
  }, [mode]);

  useEffect(() => saveStored("sre-sidebar-collapsed", sidebarCollapsed), [sidebarCollapsed]);
  useEffect(() => saveStored("sre-important-urls", urls), [urls]);
  useEffect(() => saveStored("sre-todos", todos), [todos]);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    const params = { start: toApiDate(appliedRange.start), end: toApiDate(appliedRange.end) };
    try {
      const [alertsRes, onCallRes, schedulesRes, tasksRes, taskAnalyticsRes] = await Promise.all([
        api.get("/opsgenie/alerts", { params }),
        api.get("/opsgenie/oncall"),
        api.get("/opsgenie/schedules"),
        api.get("/tasks"),
        api.get("/tasks/analytics"),
      ]);
      setAlerts(alertsRes.data);
      setSummary(buildSummaryFromAlerts(alertsRes.data));
      setOnCall(onCallRes.data);
      setSchedules(schedulesRes.data);
      setTasks(tasksRes.data);
      setTaskAnalytics(taskAnalyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [appliedRange]);

  function setQuickRange(type) {
    const end = new Date();
    const start = new Date(end);
    if (type === "15m") start.setMinutes(end.getMinutes() - 15);
    if (type === "30m") start.setMinutes(end.getMinutes() - 30);
    if (type === "1h") start.setHours(end.getHours() - 1);
    if (type === "24h") start.setDate(end.getDate() - 1);
    if (type === "7d") start.setDate(end.getDate() - 7);
    if (type === "30d") start.setDate(end.getDate() - 30);
    if (type === "month") start.setDate(1);
    const nextRange = { start: formatLocalInput(start), end: formatLocalInput(end) };
    setRange(nextRange);
    setAppliedRange(nextRange);
  }

  const drawer = (
    <Box className={sidebarCollapsed ? "sidebar collapsed" : "sidebar"}>
      <Box className="brand">
        <Box className="logo">
          <img src={mode === "dark" ? "/mintoak/logo/mintoak-symbol-white.svg" : "/mintoak/logo/mintoak-symbol-green.svg"} alt="Mintoak" />
        </Box>
        <Box className="brand-copy">
          <Typography variant="h6">{APP_NAME}</Typography>
          <Typography variant="caption">Operational Command Center</Typography>
        </Box>
      </Box>
      <IconButton className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
      </IconButton>
      <Divider />
      <Stack spacing={1} sx={{ p: 2 }}>
        {NAV_ITEMS.map((item) => (
          <Button
            key={item}
            className={active === item ? "nav-item active" : "nav-item"}
            onClick={() => {
              setActive(item);
              setMobileOpen(false);
            }}
          >
            <span>{item}</span>
          </Button>
        ))}
      </Stack>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={`app-shell ${mode}`}>
        <AppBar position="fixed" className="topbar" sx={{ left: { md: sidebarCollapsed ? "88px" : `${DRAWER_WIDTH}px` }, width: { md: `calc(100% - ${sidebarCollapsed ? 88 : DRAWER_WIDTH}px)` } }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} className="mobile-menu">
              <Menu />
            </IconButton>
            <Box className="topbar-title">
              <Box className="logo small">
                <img src={mode === "dark" ? "/mintoak/logo/mintoak-symbol-white.svg" : "/mintoak/logo/mintoak-symbol-green.svg"} alt="Mintoak" />
              </Box>
              <Box>
                <Typography variant="h6">{APP_NAME}</Typography>
                <Typography variant="caption">Dashboard Name: {active}</Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" className="clock-stack">
              <Chip label={`IST: ${clock.ist}`} />
              <Chip label={`UTC: ${clock.utc}`} />
              <IconButton color="inherit" onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
                {mode === "dark" ? <LightMode /> : <DarkMode />}
              </IconButton>
              <IconButton color="inherit" onClick={loadDashboard}>
                <Refresh />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { md: sidebarCollapsed ? 88 : DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
          <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}>
            {drawer}
          </Drawer>
          <Drawer variant="permanent" open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: sidebarCollapsed ? 88 : DRAWER_WIDTH, overflowX: "hidden" } }}>
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" className="content" sx={{ ml: { md: sidebarCollapsed ? "88px" : `${DRAWER_WIDTH}px` }, width: { md: `calc(100% - ${sidebarCollapsed ? 88 : DRAWER_WIDTH}px)` } }}>
          <Box className="hero">
            <Typography variant="h4">{APP_NAME}</Typography>
            <Typography>Unified on-call, alert, task, URL, and executive SRE visibility.</Typography>
          </Box>
          {active !== "Important URLs" && <DateFilter range={range} setRange={setRange} setQuickRange={setQuickRange} onApply={() => setAppliedRange(range)} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading && <Alert severity="info" sx={{ mb: 2 }}>Loading operational telemetry...</Alert>}
          {active === "Overview" && <Overview summary={summary} alerts={alerts} onCall={onCall} schedules={schedules} tasks={taskAnalytics} onRefresh={loadDashboard} setOnCall={setOnCall} />}
          {active === "Opsgenie Alerts" && <AlertsDashboard alerts={alerts} />}
          {active === "Team Task Summary" && <TeamTasks tasks={tasks} onUploaded={loadDashboard} />}
          {active === "Important URLs" && <ImportantUrls urls={urls} setUrls={setUrls} />}
          {active === "Jira Summary" && <JiraSummaryPage />}
          {active === "On-Call Management" && <OnCallManagementPage />}
          {active === "Shift Handover" && <ShiftHandover mode={mode} />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function DateFilter({ range, setRange, setQuickRange, onApply }) {
  return (
    <Card className="filter-card">
      <CardContent>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ lg: "center" }}>
          <TextField label="Start Date / Time" type="datetime-local" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="End Date / Time" type="datetime-local" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={onApply}>Apply Filter</Button>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => setQuickRange("15m")}>Last 15 Min</Button>
            <Button variant="outlined" onClick={() => setQuickRange("30m")}>Last 30 Min</Button>
            <Button variant="outlined" onClick={() => setQuickRange("1h")}>Last 1 Hour</Button>
            <Button variant="outlined" onClick={() => setQuickRange("24h")}>Last 24 Hours</Button>
            <Button variant="outlined" onClick={() => setQuickRange("7d")}>Last 7 Days</Button>
            <Button variant="outlined" onClick={() => setQuickRange("30d")}>Last 30 Days</Button>
            <Button variant="outlined" onClick={() => setQuickRange("month")}>Current Month</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Overview({ summary, alerts, onCall, schedules, tasks, onRefresh, setOnCall }) {
  const unackedAlerts = alerts.filter((alert) => (alert.status || "").toLowerCase() === "open" && !alert.acknowledged_at).length;
  const kpis = [
    ["Total Alerts", summary?.total_alerts || 0],
    ["Open Alerts", summary?.open_alerts || 0],
    ["Acknowledged Alerts", summary?.acknowledged_alerts || 0],
    ["Un-Acked Alerts", unackedAlerts],
    ["Closed Alerts", summary?.closed_alerts || 0],
    ["P1 Alerts", summary?.p1_count || 0],
    ["P2 Alerts", summary?.p2_count || 0],
    ["MTTA", `${summary?.mtta || 0} min`],
    ["MTTR", `${summary?.mttr || 0} min`],
  ];
  return (
    <Stack spacing={3}>
      <OpsgenieSchedulesOnCallPanel schedules={schedules} onCall={onCall} setOnCall={setOnCall} onRefresh={onRefresh} />
      <Grid container spacing={2}>{kpis.map(([label, value]) => <KpiCard key={label} label={label} value={value} />)}</Grid>
      <Grid container spacing={2}>
        <ChartCard title="Alert Priority Distribution" data={countBy(alerts, "priority")} type="pie" defaultSpan={6} defaultHeight={420} />
        <ChartCard title="Alert Status Distribution" data={countBy(alerts, "status")} type="pie" defaultSpan={6} defaultHeight={420} />
        <ChartCard title="Alerts By Source" data={countBy(alerts, "source")} type="bar" defaultSpan={6} />
        <ChartCard title="Alerts Trend" data={chartByDate(alerts)} type="line" defaultSpan={6} />
        <ChartCard title="Team Distribution" data={tasks?.tasks_by_reportee || []} type="bar" horizontal defaultSpan={12} defaultHeight={520} />
      </Grid>
    </Stack>
  );
}

function OpsgenieSchedulesOnCallPanel({ schedules, onCall, setOnCall, onRefresh }) {
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [loadingOnCall, setLoadingOnCall] = useState(false);
  const [panelError, setPanelError] = useState("");
  const selectedScheduleMeta = schedules.find((schedule) => schedule.id === selectedSchedule);
  useEffect(() => {
    if (!selectedSchedule && schedules?.length) {
      const defaultSchedule = schedules.find((schedule) => schedule.name === onCall?.schedule_name || schedule.id === onCall?.schedule_name);
      setSelectedSchedule(defaultSchedule?.id || schedules[0].id);
    }
  }, [schedules, selectedSchedule, onCall?.schedule_name]);

  async function refreshSelectedSchedule(scheduleId = selectedSchedule) {
    if (!scheduleId) {
      setPanelError("No Opsgenie schedules available to select");
      return;
    }
    setLoadingOnCall(true);
    setPanelError("");
    try {
      const response = await api.get("/opsgenie/oncall", {
        params: {
          schedule_id: scheduleId,
          schedule_identifier_type: "id",
        },
      });
      setOnCall(response.data);
    } catch (err) {
      setPanelError(err.response?.data?.detail || "Unable to load on-call details for selected schedule");
    } finally {
      setLoadingOnCall(false);
    }
  }

  function handleScheduleChange(scheduleId) {
    setSelectedSchedule(scheduleId);
    refreshSelectedSchedule(scheduleId);
  }

  const engineers = onCall?.engineers || (onCall?.name ? [onCall] : []);
  return (
    <Card className="glass-card">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6">Opsgenie Schedules & On-Call</Typography>
              <Typography color="text.secondary">Select a schedule to view the current on-call engineer.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Refresh />} variant="outlined" onClick={() => refreshSelectedSchedule()}>Refresh On-Call</Button>
              <Button startIcon={<Refresh />} variant="contained" onClick={onRefresh}>Refresh Dashboard</Button>
            </Stack>
          </Stack>

          {loadingOnCall && <LinearProgress />}
          {panelError && <Alert severity="error">{panelError}</Alert>}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Opsgenie Schedule</InputLabel>
              <Select
                label="Opsgenie Schedule"
                value={selectedSchedule}
                onChange={(event) => handleScheduleChange(event.target.value)}
                displayEmpty={false}
              >
                {schedules.map((schedule) => (
                  <MenuItem key={schedule.id} value={schedule.id}>
                    {schedule.name}{schedule.timezone ? ` (${schedule.timezone})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {!schedules.length && <EmptyState text="No Opsgenie schedules available. Check API key configuration access." />}

          <Grid container spacing={1.5}>
            <OnCallMetaCard label="Schedule Name" value={onCall?.schedule_name || "No schedule selected"} />
            <OnCallMetaCard label="Timezone" value={onCall?.timezone || engineers[0]?.timezone || selectedScheduleMeta?.timezone || "Not provided"} />
            <OnCallMetaCard label="Escalation Level" value={onCall?.escalation_level || engineers[0]?.escalation_level || "N/A"} />
            <OnCallMetaCard label="On-Call Count" value={engineers.length || 0} />
          </Grid>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Current On-Call Engineers</Typography>
            <Grid container spacing={1.5}>
              {engineers.length ? engineers.map((engineer) => (
                <Grid item xs={12} sm={6} md={4} key={`${engineer.name}-${engineer.email || ""}`}>
                  <Card className="oncall-engineer-card">
                    <CardContent>
                      <Typography variant="h6">{engineer.name}</Typography>
                      <Typography color="text.secondary">{engineer.email || "Email not provided"}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={engineer.escalation_level || onCall?.escalation_level || "Primary"} className="oncall-chip" />
                        <Chip size="small" label={engineer.timezone || onCall?.timezone || selectedScheduleMeta?.timezone || "Timezone N/A"} className="oncall-chip" />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )) : (
                <Grid item xs={12}><EmptyState text="No active on-call engineer returned for this schedule." /></Grid>
              )}
            </Grid>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function OnCallMetaCard({ label, value }) {
  return (
    <Grid item xs={6} md={3}>
      <Card className="oncall-meta-card">
        <CardContent>
          <Typography color="text.secondary" variant="caption">{label}</Typography>
          <Typography variant="subtitle1">{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function KpiCard({ label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card className="kpi-card">
        <CardContent>
          <Typography color="text.secondary" variant="body2">{label}</Typography>
          <Typography variant="h5">{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function ChartCard({ title, data, type, stackKeys = [], colors = {}, defaultHeight = 380, defaultSpan, horizontal = false }) {
  const safeData = data?.length ? data : [{ name: "No data", value: 0 }];
  const storageKey = `v3-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const [height, setHeight] = useState(() => getStored(`panel-height-${storageKey}`, defaultHeight));
  const [span, setSpan] = useState(() => getStored(`panel-span-${storageKey}`, defaultSpan || 6));

  useEffect(() => saveStored(`panel-height-${storageKey}`, height), [height, storageKey]);
  useEffect(() => saveStored(`panel-span-${storageKey}`, span), [span, storageKey]);

  return (
    <Grid item xs={12} lg={span}>
      <Card className="chart-card">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6">{title}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" onClick={() => setSpan(span === 12 ? 6 : 12)}>{span === 12 ? "Half width" : "Full width"}</Button>
              <Button size="small" variant="outlined" onClick={() => setHeight(Math.max(260, height - 80))}>-</Button>
              <TextField size="small" label="Height" type="number" value={height} onChange={(e) => setHeight(Math.max(260, Number(e.target.value) || defaultHeight))} sx={{ width: 105 }} />
              <Button size="small" variant="outlined" onClick={() => setHeight(height + 80)}>+</Button>
            </Stack>
          </Stack>
          <Box sx={{ height }}>
            <ResponsiveContainer>
              {type === "pie" || type === "donut" ? (
                <PieChart>
                  <Pie data={safeData} dataKey="value" nameKey="name" innerRadius={type === "donut" ? "55%" : 0} outerRadius="82%" label>
                    {safeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : type === "line" ? (
                <LineChart data={safeData} margin={{ top: 12, right: 26, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" minTickGap={18} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="value" stroke="#4A8B27" strokeWidth={3} />
                </LineChart>
              ) : type === "stacked" ? (
                <BarChart data={safeData} margin={{ top: 12, right: 26, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" minTickGap={18} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {stackKeys.map((key, index) => <Bar key={key} dataKey={key} stackId="stack" fill={colors[key] || COLORS[index % COLORS.length]} radius={index === stackKeys.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} />)}
                </BarChart>
              ) : (
                <BarChart data={safeData} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 12, right: 28, bottom: horizontal ? 12 : 44, left: horizontal ? 24 : 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  {horizontal ? <XAxis type="number" allowDecimals={false} /> : <XAxis dataKey="name" minTickGap={14} angle={-18} textAnchor="end" height={64} />}
                  {horizontal ? <YAxis type="category" dataKey="name" width={150} /> : <YAxis allowDecimals={false} />}
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#4A8B27" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

function AlertsDashboard({ alerts }) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const filtered = alerts
    .filter((alert) => [alert.message, alert.alias, alert.source, alert.owner].join(" ").toLowerCase().includes(query.toLowerCase()))
    .filter((alert) => !priority || alert.priority === priority)
    .filter((alert) => !status || alert.status === status)
    .filter((alert) => !source || alert.source === source)
    .sort((a, b) => sort === "latest" ? new Date(b.created_at || 0) - new Date(a.created_at || 0) : new Date(a.created_at || 0) - new Date(b.created_at || 0));
  return (
    <Stack spacing={3}>
      <AlertAnalytics alerts={filtered} />
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Alert Details View</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Search" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth />
            <SelectField label="Priority" value={priority} setValue={setPriority} options={["", "P1", "P2", "P3", "P4", "P5"]} />
            <SelectField label="Status" value={status} setValue={setStatus} options={["", "open", "acknowledged", "closed"]} />
            <SelectField label="Source" value={source} setValue={setSource} options={["", ...new Set(alerts.map((a) => a.source).filter(Boolean))]} />
            <SelectField label="Sort" value={sort} setValue={setSort} options={["latest", "oldest"]} />
          </Stack>
          <DataTable
            rows={filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
            columns={["Alert ID", "Message", "Priority", "Status", "Source", "Tags", "Created At (IST)", "Updated At (IST)", "Responders", "Owner", "Open"]}
            render={(alert) => [
              alert.alert_id,
              alert.message,
              alert.priority,
              alert.status,
              alert.source,
              alert.tags?.join(", "),
              formatIst(alert.created_at),
              formatIst(alert.updated_at),
              alert.responders?.join(", "),
              alert.owner,
              alert.alert_url ? <Button key={`${alert.alert_id}-open`} size="small" startIcon={<Launch />} href={alert.alert_url} target="_blank" rel="noreferrer">Opsgenie</Button> : "-",
            ]}
          />
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[25, 50, 100]} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} />
        </CardContent>
      </Card>
    </Stack>
  );
}

function AlertAnalytics({ alerts }) {
  const priorities = ["P1", "P2", "P3", "P4", "P5"];
  const statuses = ["open", "acknowledged", "closed"];
  const dailyStatus = buildStackedData(alerts, "created_at", "status", statuses);
  const dailyPriority = buildStackedData(alerts, "created_at", "priority", priorities);
  const closedByDay = dailyStatus.map((row) => ({
    name: row.name,
    total: statuses.reduce((sum, key) => sum + (row[key] || 0), 0),
    closed: row.closed || 0,
  }));
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <KpiCard label="Number of Alerts" value={alerts.length} />
        <KpiCard label="P1 Alerts" value={alerts.filter((alert) => alert.priority === "P1").length} />
        <KpiCard label="Open Alerts" value={alerts.filter((alert) => alert.status === "open").length} />
        <KpiCard label="Closed Alerts" value={alerts.filter((alert) => alert.status === "closed").length} />
      </Grid>
      <Grid container spacing={2}>
        <ChartCard title="Number of Alerts by Status" data={countBy(alerts, "status")} type="donut" defaultHeight={420} />
        <ChartCard title="Number of Alerts by Priority" data={countBy(alerts, "priority")} type="donut" defaultHeight={420} />
        <ChartCard title="Number of Alerts per Day by Status" data={dailyStatus} type="stacked" stackKeys={statuses} colors={STATUS_COLORS} defaultHeight={460} />
        <ChartCard title="Number of Alerts per Day by Priority" data={dailyPriority} type="stacked" stackKeys={priorities} colors={PRIORITY_COLORS} defaultHeight={460} />
        <ChartCard title="Number of Alerts by Source" data={countBy(alerts, "source").sort((a, b) => b.value - a.value).slice(0, 10)} type="bar" horizontal defaultHeight={440} />
        <ChartCard title="Alerts by Tag" data={topTags(alerts)} type="bar" horizontal defaultHeight={440} />
        <ChartCard title="Number of Alerts by Hour (IST)" data={buildAlertsByHour(alerts)} type="bar" defaultHeight={420} />
        <ChartCard title="Number of Alerts Closed Versus Total Alerts" data={closedByDay} type="stacked" stackKeys={["total", "closed"]} colors={{ total: "#3f6df6", closed: "#68d391" }} defaultHeight={420} />
        <ChartCard title="Number of Alerts by Day of Week" data={buildAlertsByDayOfWeek(alerts)} type="stacked" stackKeys={["business", "offHours"]} colors={{ business: "#f6c22d", offHours: "#8b7be1" }} defaultHeight={420} />
        <ChartCard title="Alerts Trend" data={chartByDate(alerts)} type="line" defaultHeight={420} />
      </Grid>
    </Stack>
  );
}

function taskResolution(task) {
  return task.Resolution ?? task["Resolution / Action Item"] ?? "";
}

function taskDisplayRow(task) {
  return {
    Date: task.Date,
    Client: task.Client,
    Reportee: task.Reportee,
    Status: task.Status || "Open",
    "Alert Name": task["Alert Name"],
    Summary: task.Summary,
    Resolution: taskResolution(task),
    Tracker: task.Tracker,
    "Updates / Remark": task["Updates / Remark"],
  };
}

function TeamTasks({ tasks, onUploaded }) {
  const [query, setQuery] = useState("");
  const [taskRange, setTaskRange] = useState(() => ({ start: "", end: "" }));
  const [addOpen, setAddOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TEAM_TASK);
  const [manualTasks, setManualTasks] = useState(() => getStored("sre-manual-team-tasks", []));
  useEffect(() => saveStored("sre-manual-team-tasks", manualTasks), [manualTasks]);
  const allTasks = [...manualTasks, ...tasks];
  const filtered = allTasks
    .filter((task) => [task.Client, task.Reportee, task.Status, task.Tracker, task["Alert Name"]].join(" ").toLowerCase().includes(query.toLowerCase()))
    .filter((task) => {
      const date = parseTaskDate(task.Date);
      if (!date) return false;
      const start = taskRange.start ? new Date(taskRange.start) : null;
      const end = taskRange.end ? new Date(taskRange.end) : null;
      if (end) end.setHours(23, 59, 59, 999);
      return (!start || date >= start) && (!end || date <= end);
    })
    .sort((a, b) => (parseTaskDate(b.Date)?.getTime() || 0) - (parseTaskDate(a.Date)?.getTime() || 0));
  const filteredAnalytics = {
    total_tasks: filtered.length,
    unique_clients: new Set(filtered.map((task) => task.Client).filter(Boolean)).size,
    unique_reportees: new Set(filtered.map((task) => task.Reportee).filter(Boolean)).size,
    missing_resolution_tasks: filtered.filter((task) => !taskResolution(task).trim()).length,
    tasks_by_client: countBy(filtered, "Client"),
    tasks_by_reportee: countBy(filtered, "Reportee"),
  };
  function setTaskQuickRange(type) {
    const end = new Date();
    const start = new Date(end);
    if (type === "7d") start.setDate(end.getDate() - 7);
    if (type === "30d") start.setDate(end.getDate() - 30);
    if (type === "month") start.setDate(1);
    setTaskRange({ start: formatLocalInput(start).slice(0, 10), end: formatLocalInput(end).slice(0, 10) });
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await api.post("/tasks/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
    onUploaded();
  }
  function exportTasks() {
    downloadCsv(`sre-team-tasks-${todayInputDate()}.csv`, TASK_TABLE_COLUMNS, filtered.map(taskDisplayRow));
  }
  function addTask() {
    const nextTask = {
      ...taskForm,
      "Resolution / Action Item": taskForm.Resolution,
    };
    setManualTasks([nextTask, ...manualTasks]);
    setTaskForm({ ...EMPTY_TEAM_TASK, Date: todayInputDate() });
    setAddOpen(false);
  }
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <KpiCard label="Total Tasks" value={filteredAnalytics.total_tasks} />
        <KpiCard label="Unique Clients" value={filteredAnalytics.unique_clients} />
        <KpiCard label="Unique Reportees" value={filteredAnalytics.unique_reportees} />
        <KpiCard label="Tasks Missing Resolution" value={filteredAnalytics.missing_resolution_tasks} />
      </Grid>
      <Grid container spacing={2}>
        <ChartCard title="Tasks by Client" data={filteredAnalytics.tasks_by_client} type="bar" horizontal defaultSpan={6} defaultHeight={500} />
        <ChartCard title="Tasks by Reportee" data={filteredAnalytics.tasks_by_reportee} type="bar" horizontal defaultSpan={6} defaultHeight={500} />
      </Grid>
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <TextField label="Search by Client, Reportee, Status, Tracker, Alert Name" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth />
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Add />} variant="outlined" onClick={() => setAddOpen(true)}>Add Task</Button>
              <Button variant="outlined" onClick={exportTasks}>Export Table CSV</Button>
              <Button variant="contained" component="label">Upload CSV<input hidden type="file" accept=".csv" onChange={upload} /></Button>
            </Stack>
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ mb: 2 }} alignItems={{ lg: "center" }}>
            <TextField label="Start Date" type="date" value={taskRange.start} onChange={(e) => setTaskRange({ ...taskRange, start: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" type="date" value={taskRange.end} onChange={(e) => setTaskRange({ ...taskRange, end: e.target.value })} InputLabelProps={{ shrink: true }} />
            <Button variant="outlined" onClick={() => setTaskRange({ start: "", end: "" })}>All Dates</Button>
            <Button variant="outlined" onClick={() => setTaskQuickRange("7d")}>Last 7 Days</Button>
            <Button variant="outlined" onClick={() => setTaskQuickRange("30d")}>Last 30 Days</Button>
            <Button variant="outlined" onClick={() => setTaskQuickRange("month")}>Current Month</Button>
          </Stack>
          <DataTable
            rows={filtered}
            columns={TASK_TABLE_COLUMNS}
            render={(task) => [
              task.Date,
              task.Client,
              task.Reportee,
              task.Status || "Open",
              task["Alert Name"],
              task.Summary,
              taskResolution(task) || "Missing",
              task.Tracker,
              task["Updates / Remark"],
            ]}
          />
        </CardContent>
      </Card>
      <EditDialog title="Add Summary Task" open={addOpen} onClose={() => setAddOpen(false)} onSave={addTask}>
        <TextField label="Date" type="date" value={taskForm.Date} onChange={(e) => setTaskForm({ ...taskForm, Date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
        <TextField label="Client" value={taskForm.Client} onChange={(e) => setTaskForm({ ...taskForm, Client: e.target.value })} fullWidth />
        <TextField label="Reportee" value={taskForm.Reportee} onChange={(e) => setTaskForm({ ...taskForm, Reportee: e.target.value })} fullWidth />
        <SelectField label="Status" value={taskForm.Status} setValue={(value) => setTaskForm({ ...taskForm, Status: value })} options={["Open", "In Progress", "Resolved", "Closed"]} />
        <TextField label="Alert Name" value={taskForm["Alert Name"]} onChange={(e) => setTaskForm({ ...taskForm, "Alert Name": e.target.value })} fullWidth />
        <TextField label="Summary" value={taskForm.Summary} onChange={(e) => setTaskForm({ ...taskForm, Summary: e.target.value })} fullWidth multiline rows={3} />
        <TextField label="Resolution" value={taskForm.Resolution} onChange={(e) => setTaskForm({ ...taskForm, Resolution: e.target.value })} fullWidth multiline rows={3} />
        <TextField label="Tracker" value={taskForm.Tracker} onChange={(e) => setTaskForm({ ...taskForm, Tracker: e.target.value })} fullWidth />
        <TextField label="Updates / Remark" value={taskForm["Updates / Remark"]} onChange={(e) => setTaskForm({ ...taskForm, "Updates / Remark": e.target.value })} fullWidth multiline rows={2} />
      </EditDialog>
    </Stack>
  );
}

function ImportantUrls({ urls, setUrls }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_URL);
  function save() {
    if (editing) setUrls(urls.map((item) => item.id === editing ? { ...form, id: editing } : item));
    else setUrls([{ ...form, id: crypto.randomUUID() }, ...urls]);
    setOpen(false);
    setEditing(null);
    setForm(EMPTY_URL);
  }
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between"><Typography variant="h6">Important URLs</Typography><Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Add URL</Button></Stack>
      <Card className="glass-card">
        <CardContent>
          <DataTable
            rows={urls}
            columns={["Title", "URL", "Category", "Description", "Actions"]}
            render={(item) => [
              item.title,
              <Button key="open-url" startIcon={<Launch />} href={item.url} target="_blank" rel="noreferrer">{item.url}</Button>,
              item.category,
              item.description,
              <Stack key="actions" direction="row" spacing={1}>
                <IconButton onClick={() => { setEditing(item.id); setForm(item); setOpen(true); }}><Edit /></IconButton>
                <IconButton onClick={() => setUrls(urls.filter((url) => url.id !== item.id))}><Delete /></IconButton>
              </Stack>,
            ]}
          />
        </CardContent>
      </Card>
      <EditDialog title="URL" open={open} onClose={() => setOpen(false)} onSave={save}>
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} fullWidth />
        <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth />
        <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={3} />
      </EditDialog>
    </Stack>
  );
}

function TodoTracker({ todos, setTodos, embedded = false }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TODO);
  const [filters, setFilters] = useState({ status: "", priority: "", owner: "" });
  const filtered = todos.filter((todo) => (!filters.status || todo.status === filters.status) && (!filters.priority || todo.priority === filters.priority) && (!filters.owner || todo.owner.toLowerCase().includes(filters.owner.toLowerCase())));
  const counts = {
    total: todos.length,
    pending: todos.filter((t) => t.status === "Pending").length,
    progress: todos.filter((t) => t.status === "In Progress").length,
    completed: todos.filter((t) => t.status === "Completed").length,
    critical: todos.filter((t) => t.priority === "Critical").length,
  };
  function save() {
    if (editing) setTodos(todos.map((item) => item.id === editing ? { ...form, id: editing } : item));
    else setTodos([{ ...form, id: crypto.randomUUID() }, ...todos]);
    setOpen(false);
    setEditing(null);
    setForm(EMPTY_TODO);
  }
  return (
    <Stack spacing={2}>
      {embedded && (
        <Box>
          <Typography variant="h6">To-Do Tracker</Typography>
          <Typography color="text.secondary">Add operational follow-ups directly from Team Task Summary.</Typography>
        </Box>
      )}
      <Grid container spacing={2}>
        <KpiCard label="Total Tasks" value={counts.total} /><KpiCard label="Pending Tasks" value={counts.pending} /><KpiCard label="In Progress Tasks" value={counts.progress} /><KpiCard label="Completed Tasks" value={counts.completed} /><KpiCard label="Critical Tasks" value={counts.critical} />
      </Grid>
      <Card><CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <SelectField label="Status" value={filters.status} setValue={(v) => setFilters({ ...filters, status: v })} options={["", "Pending", "In Progress", "Completed"]} />
            <SelectField label="Priority" value={filters.priority} setValue={(v) => setFilters({ ...filters, priority: v })} options={["", "Low", "Medium", "High", "Critical"]} />
            <TextField label="Owner" value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })} />
          </Stack>
          <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Add Task</Button>
        </Stack>
        {filtered.length === 0 ? <EmptyState text="No To-Do tasks match the current filters." /> : filtered.map((todo) => (
          <Card className="todo-card" key={todo.id}><CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
              <Box><Typography variant="h6">{todo.title}</Typography><Typography color="text.secondary">{todo.description}</Typography><Stack direction="row" spacing={1} sx={{ mt: 1 }}><Chip label={todo.priority} /><Chip label={todo.status} /><Chip label={todo.owner || "Unassigned"} /><Chip label={todo.dueDate || "No due date"} /></Stack></Box>
              <Stack direction="row"><IconButton onClick={() => setTodos(todos.map((item) => item.id === todo.id ? { ...item, status: "Completed" } : item))}><CheckCircle /></IconButton><IconButton onClick={() => { setEditing(todo.id); setForm(todo); setOpen(true); }}><Edit /></IconButton><IconButton onClick={() => setTodos(todos.filter((item) => item.id !== todo.id))}><Delete /></IconButton></Stack>
            </Stack>
          </CardContent></Card>
        ))}
      </CardContent></Card>
      <EditDialog title="To-Do Task" open={open} onClose={() => setOpen(false)} onSave={save}>
        <TextField label="Task Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={3} />
        <SelectField label="Priority" value={form.priority} setValue={(v) => setForm({ ...form, priority: v })} options={["Low", "Medium", "High", "Critical"]} fullWidth />
        <SelectField label="Status" value={form.status} setValue={(v) => setForm({ ...form, status: v })} options={["Pending", "In Progress", "Completed"]} fullWidth />
        <TextField label="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} fullWidth />
        <TextField label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
      </EditDialog>
    </Stack>
  );
}

function JiraSummaryPage() {
  const [summary, setSummary] = useState(null);
  const [jql, setJql] = useState("");
  const [maxResults, setMaxResults] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadJiraSummary(nextJql = jql) {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/jira/summary", {
        params: {
          jql: nextJql || undefined,
          max_results: maxResults,
        },
      });
      setSummary(response.data);
      if (!nextJql && response.data.jql) setJql(response.data.jql);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load Jira summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJiraSummary("");
  }, []);

  const configured = summary?.configured;
  return (
    <Stack spacing={3}>
      <Card className="glass-card">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6">Jira Summary</Typography>
                <Typography color="text.secondary">Read-only Jira operational summary. API token stays in the FastAPI backend.</Typography>
              </Box>
              <Button startIcon={<Refresh />} variant="contained" onClick={() => loadJiraSummary()}>Refresh Jira</Button>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="JQL" value={jql} onChange={(event) => setJql(event.target.value)} fullWidth />
              <TextField label="Max Results" type="number" value={maxResults} onChange={(event) => setMaxResults(Math.max(1, Math.min(500, Number(event.target.value) || 100)))} sx={{ minWidth: 150 }} />
              <Button variant="outlined" onClick={() => loadJiraSummary()}>Apply JQL</Button>
            </Stack>
            {loading && <LinearProgress />}
            {error && <Alert severity="error">{error}</Alert>}
            {summary && !configured && <Alert severity="warning">Jira is not configured. Add JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in backend/.env, then restart the backend container.</Alert>}
            {summary?.configured && !summary?.authenticated && <Alert severity="error">{summary.error_message || "Jira authentication failed. Verify backend Jira credentials."}</Alert>}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <KpiCard label="Total Issues" value={summary?.total_issues || 0} />
        <KpiCard label="Open Issues" value={summary?.open_issues || 0} />
        <KpiCard label="In Progress" value={summary?.in_progress_issues || 0} />
        <KpiCard label="Done Issues" value={summary?.done_issues || 0} />
        <KpiCard label="Unassigned" value={summary?.unassigned_issues || 0} />
      </Grid>

      <Grid container spacing={2}>
        <ChartCard title="Jira Issues by Status" data={summary?.by_status || []} type="bar" horizontal defaultSpan={6} defaultHeight={460} />
        <ChartCard title="Jira Issues by Priority" data={summary?.by_priority || []} type="bar" horizontal defaultSpan={6} defaultHeight={460} />
        <ChartCard title="Jira Issues by Type" data={summary?.by_issue_type || []} type="pie" defaultSpan={6} defaultHeight={420} />
        <ChartCard title="Jira Issues by Assignee" data={(summary?.by_assignee || []).slice(0, 12)} type="bar" horizontal defaultSpan={6} defaultHeight={500} />
      </Grid>

      <Card className="glass-card">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Jira Issues</Typography>
          <DataTable
            rows={summary?.recent_issues || []}
            columns={["Key", "Summary", "Status", "Priority", "Type", "Assignee", "Updated (IST)", "Open"]}
            render={(issue) => [
              issue.key,
              issue.summary,
              issue.status,
              issue.priority,
              issue.issue_type,
              issue.assignee,
              formatJiraDate(issue.updated),
              issue.url ? <Button key={`${issue.key}-open`} startIcon={<Launch />} href={issue.url} target="_blank" rel="noreferrer">Open</Button> : "-",
            ]}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

function OnCallManagementPage() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [range, setRange] = useState(defaultOnCallRange);
  const [timeline, setTimeline] = useState(null);
  const [config, setConfig] = useState(null);
  const [configDraft, setConfigDraft] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ user: "", start: "", end: "", alias: "", rotation_id: "" });
  const [nowTick, setNowTick] = useState(() => new Date());
  const axis = timelineAxis(range.start, range.end);
  const entries = timeline?.entries || [];
  const engineers = [...new Set(entries.map((entry) => entry.name).filter(Boolean))].sort();
  const rosterRows = buildRosterRows(entries);
  const selectedScheduleMeta = schedules.find((schedule) => schedule.id === selectedSchedule);
  const now = nowTick;
  const nowLine = currentTimeStyle(now, axis);
  const currentEntries = entries.filter((entry) => (!entry.start || new Date(entry.start) <= now) && (!entry.end || new Date(entry.end) >= now));
  const upcomingEntries = entries
    .filter((entry) => entry.start && new Date(entry.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const nextHandoff = upcomingEntries[0];
  const rotationParticipants = [...new Set(
    (config?.rotations || []).flatMap((rotation) => (rotation.participants || []).map((participant) => participant.username || participant.name).filter(Boolean)),
  )].sort();
  const relatedEscalations = (config?.escalations || []).filter((escalation) =>
    (escalation.rules || []).some((rule) => {
      const recipient = rule.recipient || {};
      return recipient.id === selectedSchedule || recipient.name === selectedScheduleMeta?.name;
    }),
  );

  async function loadSchedules() {
    const response = await api.get("/opsgenie/schedules");
    setSchedules(response.data);
    if (!selectedSchedule && response.data.length) setSelectedSchedule(response.data[0].id);
  }

  async function loadTimeline(scheduleId = selectedSchedule) {
    if (!scheduleId) return;
    setLoading(true);
    setError("");
    try {
      const [timelineResponse, configResponse] = await Promise.all([
        api.get("/opsgenie/timeline", {
          params: {
            schedule_id: scheduleId,
            start: toApiDate(range.start),
            end: toApiDate(range.end),
            schedule_identifier_type: "id",
          },
        }),
        api.get("/opsgenie/schedule-config", {
          params: { schedule_id: scheduleId, schedule_identifier_type: "id" },
        }),
      ]);
      setTimeline(timelineResponse.data);
      setConfig(configResponse.data);
      setConfigDraft(JSON.stringify(configResponse.data.schedule || {}, null, 2));
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load on-call timeline");
    } finally {
      setLoading(false);
    }
  }

  function setQuickRange(type) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (type === "1d") end.setDate(start.getDate() + 1);
    if (type === "1w") end.setDate(start.getDate() + 7);
    if (type === "2w") end.setDate(start.getDate() + 14);
    if (type === "1m") end.setMonth(start.getMonth() + 1);
    end.setHours(23, 59, 0, 0);
    setRange({ start: formatLocalInput(start), end: formatLocalInput(end) });
  }

  async function submitOverride() {
    setMessage("");
    setError("");
    try {
      const response = await api.post("/opsgenie/overrides", {
        schedule_id: selectedSchedule,
        user: overrideForm.user,
        start: toApiDate(overrideForm.start),
        end: toApiDate(overrideForm.end),
        alias: overrideForm.alias,
        rotation_id: overrideForm.rotation_id || null,
        schedule_identifier_type: "id",
      });
      if (!response.data.success) throw new Error(response.data.message || "Override failed");
      setMessage(response.data.message);
      setOverrideOpen(false);
      loadTimeline();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to create override");
    }
  }

  async function saveScheduleConfig() {
    setMessage("");
    setError("");
    try {
      const payload = JSON.parse(configDraft);
      const response = await api.patch("/opsgenie/schedule-config", payload, {
        params: { schedule_id: selectedSchedule, schedule_identifier_type: "id" },
      });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to update schedule configuration");
    }
  }

  useEffect(() => {
    loadSchedules().catch((err) => setError(err.response?.data?.detail || "Unable to load schedules"));
  }, []);

  useEffect(() => {
    if (selectedSchedule) loadTimeline(selectedSchedule);
  }, [selectedSchedule, range.start, range.end]);

  useEffect(() => {
    if (!selectedSchedule) return undefined;
    const timer = setInterval(() => loadTimeline(selectedSchedule), 60000);
    return () => clearInterval(timer);
  }, [selectedSchedule, range.start, range.end]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Stack spacing={2.5}>
      <Card className="oncall-command-card">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h5">{selectedScheduleMeta?.name || "On-Call Management"}</Typography>
                  <Chip size="small" label={selectedScheduleMeta?.enabled === false ? "Disabled" : "Active"} color={selectedScheduleMeta?.enabled === false ? "default" : "success"} />
                  <Chip size="small" label={timeline?.timezone || selectedScheduleMeta?.timezone || "Timezone not provided"} />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>Live coverage, handoffs, rotations, and schedule controls.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button startIcon={<Refresh />} variant="outlined" onClick={() => loadTimeline()}>Refresh</Button>
                <Button variant="outlined" onClick={() => setAdvancedOpen(true)} disabled={!selectedSchedule}>Advanced</Button>
                <Button variant="contained" onClick={() => setOverrideOpen(true)} disabled={!selectedSchedule}>Override Shift</Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} alignItems={{ xl: "center" }}>
              <FormControl sx={{ minWidth: 280 }}>
                <InputLabel>Schedule</InputLabel>
                <Select label="Schedule" value={selectedSchedule} onChange={(event) => setSelectedSchedule(event.target.value)}>
                  {schedules.map((schedule) => <MenuItem key={schedule.id} value={schedule.id}>{schedule.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => setQuickRange("1d")}>Today</Button>
                <Button variant="outlined" onClick={() => setQuickRange("1w")}>7 Days</Button>
                <Button variant="outlined" onClick={() => setQuickRange("2w")}>14 Days</Button>
                <Button variant="outlined" onClick={() => setQuickRange("1m")}>30 Days</Button>
              </Stack>
              <TextField label="From" type="datetime-local" value={range.start} onChange={(event) => setRange({ ...range, start: event.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField label="To" type="datetime-local" value={range.end} onChange={(event) => setRange({ ...range, end: event.target.value })} InputLabelProps={{ shrink: true }} />
            </Stack>
            {loading && <LinearProgress />}
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card className="current-oncall-card">
            <CardContent>
              <Typography color="text.secondary" variant="overline">On call now</Typography>
              {currentEntries.length ? (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {currentEntries.map((entry) => (
                    <Stack direction="row" spacing={1.5} alignItems="center" key={`${entry.name}-${entry.start}`}>
                      <Box className="engineer-avatar">{engineerInitials(entry.name)}</Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" noWrap>{displayEngineer(entry.name)}</Typography>
                        <Typography color="text.secondary" variant="body2" noWrap>{entry.name}</Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Chip size="small" label={entry.rotation || "On-call"} className="timeline-chip" />
                        <Typography color="text.secondary" variant="caption" display="block" sx={{ mt: 0.5 }}>Until {formatIst(entry.end)}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : <EmptyState text="No active coverage found at the current time." />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={7}>
          <Grid container spacing={2}>
            <KpiCard label="Next Handoff" value={nextHandoff ? formatIst(nextHandoff.start) : "None scheduled"} />
            <KpiCard label="Engineers in Range" value={engineers.length} />
            <KpiCard label="Rotations" value={config?.rotations?.length || 0} />
            <KpiCard label="Related Escalations" value={relatedEscalations.length} />
          </Grid>
        </Grid>
      </Grid>

      <Card className="glass-card">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">Coverage Timeline</Typography>
              <Typography color="text.secondary">Daily view in IST. Scroll horizontally for longer ranges.</Typography>
            </Box>
            <Chip label={`${formatIst(range.start)} to ${formatIst(range.end)}`} />
          </Stack>
          {!entries.length ? <EmptyState text="No timeline entries returned for this schedule and range." /> : (
            <Box className="timeline-wrap">
              <Box className="hourly-timeline roster-timeline" sx={{ width: `${190 + axis.width}px` }}>
                <Box className="hourly-timeline-header">
                  <Box className="timeline-engineer-head">Shift</Box>
                  <Box className="timeline-axis" sx={{ width: `${axis.width}px` }}>
                    <Box className="timeline-day-bands">
                      {axis.days.map((day) => (
                        <Box
                          className={`timeline-day-band ${dateKey(day.date, "Asia/Kolkata") === dateKey(now, "Asia/Kolkata") ? "today" : ""}`}
                          key={day.date.toISOString()}
                          sx={{ width: `${day.hours * TIMELINE_HOUR_WIDTH}px` }}
                        >
                          {day.date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
                        </Box>
                      ))}
                    </Box>
                    <Box className="timeline-hour-axis">
                      {Array.from({ length: Math.ceil(axis.hours) }, (_, index) => {
                        const tick = new Date(axis.start.getTime() + index * 3600000);
                        return (
                          <Box className="timeline-hour-tick" key={tick.toISOString()} sx={{ width: `${TIMELINE_HOUR_WIDTH}px` }}>
                            {tick.toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true }).replace(" ", "")}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
                {rosterRows.map((row) => (
                  <Box className="hourly-timeline-row" key={row.id}>
                    <Box className="timeline-engineer roster-shift-label" sx={{ minHeight: `${row.height}px` }}>
                      <Box className={`shift-dot ${row.colorClass}`} />
                      <Box>
                        <Typography variant="body2" fontWeight={900}>{row.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.entries.length} assignment{row.entries.length === 1 ? "" : "s"}</Typography>
                      </Box>
                    </Box>
                    <Box className="timeline-track roster-track" sx={{ width: `${axis.width}px`, minHeight: `${row.height}px` }}>
                      {nowLine && <Box className="current-time-line" sx={nowLine}><span>Now</span></Box>}
                      {row.entries.map((entry, index) => {
                        const style = timelineBarStyle(entry, axis);
                        if (!style) return null;
                        return (
                          <Box
                            className={`shift-block roster-shift-block ${row.colorClass}`}
                            key={`${entry.name}-${entry.start}-${index}`}
                            sx={{ ...style, top: `${12 + (entry.lane || 0) * 68}px`, "--engineer-color": engineerColor(entry.name) }}
                          >
                            <Box className="shift-engineer-avatar">{engineerInitials(entry.name)}</Box>
                            <Box className="shift-block-copy">
                              <Typography variant="caption" fontWeight={900}>{displayEngineer(entry.name)}</Typography>
                              <Typography variant="caption" fontWeight={700}>{entry.rotation || row.label}</Typography>
                              <Typography variant="caption">{formatIstTime(entry.start)} - {formatIstTime(entry.end)}</Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card className="glass-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Upcoming Shifts</Typography>
              <DataTable
                rows={upcomingEntries.slice(0, 20)}
                columns={["Engineer", "Rotation", "Starts", "Ends", "Duration"]}
                render={(entry) => [displayEngineer(entry.name), entry.rotation, formatIst(entry.start), formatIst(entry.end), shiftDuration(entry)]}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card className="glass-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Rotations</Typography>
              <Stack spacing={1.5}>
                {(config?.rotations || []).map((rotation) => {
                  const restriction = rotation.timeRestriction?.restriction;
                  return (
                    <Box className="rotation-summary" key={rotation.id || rotation.name}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography fontWeight={800}>{rotation.name || "Unnamed rotation"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rotation.type || "rotation"} · every {rotation.length || 1} {rotation.type === "weekly" ? "week" : "period"}
                            {restriction ? ` · ${String(restriction.startHour).padStart(2, "0")}:${String(restriction.startMin || 0).padStart(2, "0")} - ${String(restriction.endHour).padStart(2, "0")}:${String(restriction.endMin || 0).padStart(2, "0")}` : ""}
                          </Typography>
                        </Box>
                        <Chip size="small" label={`${rotation.participants?.length || 0} people`} />
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {(rotation.participants || []).map((participant) => <Chip size="small" key={participant.id || participant.username} label={displayEngineer(participant.username || participant.name)} />)}
                      </Stack>
                    </Box>
                  );
                })}
                {!config?.rotations?.length && <EmptyState text="No rotations returned." />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card className="glass-card">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Escalations Using This Schedule</Typography>
          <DataTable
            rows={relatedEscalations}
            columns={["Escalation", "Condition", "Delay", "Recipient"]}
            render={(escalation) => {
              const rule = (escalation.rules || []).find((item) => item.recipient?.id === selectedSchedule || item.recipient?.name === selectedScheduleMeta?.name) || {};
              return [
                escalation.name,
                rule.condition,
                rule.delay ? `${rule.delay.timeAmount} ${rule.delay.timeUnit}` : "Immediate",
                rule.recipient?.name || selectedScheduleMeta?.name,
              ];
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Override On-Call Shift</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Replacement engineer</InputLabel>
              <Select label="Replacement engineer" value={overrideForm.user} onChange={(event) => setOverrideForm({ ...overrideForm, user: event.target.value })}>
                {rotationParticipants.map((participant) => <MenuItem key={participant} value={participant}>{displayEngineer(participant)} ({participant})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Start Date / Time" type="datetime-local" value={overrideForm.start} onChange={(event) => setOverrideForm({ ...overrideForm, start: event.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End Date / Time" type="datetime-local" value={overrideForm.end} onChange={(event) => setOverrideForm({ ...overrideForm, end: event.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Reason" value={overrideForm.alias} onChange={(event) => setOverrideForm({ ...overrideForm, alias: event.target.value })} placeholder="Leave, planned swap, emergency coverage..." fullWidth />
            <FormControl fullWidth>
              <InputLabel>Rotation (optional)</InputLabel>
              <Select label="Rotation (optional)" value={overrideForm.rotation_id} onChange={(event) => setOverrideForm({ ...overrideForm, rotation_id: event.target.value })}>
                <MenuItem value="">Entire schedule</MenuItem>
                {(config?.rotations || []).map((rotation) => <MenuItem key={rotation.id} value={rotation.id}>{rotation.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Alert severity="info">The replacement engineer will cover the selected period in Opsgenie.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitOverride} disabled={!overrideForm.user || !overrideForm.start || !overrideForm.end}>Submit Override</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={advancedOpen} onClose={() => setAdvancedOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Advanced Schedule Configuration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">This sends a direct schedule PATCH to Opsgenie. Use only with configuration write access and a reviewed payload.</Alert>
            <TextField label="Schedule JSON Patch Payload" value={configDraft} onChange={(event) => setConfigDraft(event.target.value)} fullWidth multiline minRows={16} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdvancedOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveScheduleConfig} disabled={!selectedSchedule}>Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function ShiftHandover({ mode }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [shiftDate, setShiftDate] = useState(todayInputDate);
  const [selectedShift, setSelectedShift] = useState("morning");
  const [shiftAlerts, setShiftAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertError, setAlertError] = useState("");
  const shiftRange = buildShiftRange(shiftDate, selectedShift);
  const selectedShiftLabel = SHIFT_OPTIONS.find((shift) => shift.id === selectedShift)?.label || "N/A";
  const handoverAlerts = shiftAlerts
    .filter((alert) => (alert.status || "").toLowerCase() === "open")
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  async function loadShiftAlerts() {
    setLoadingAlerts(true);
    setAlertError("");
    setMessage("");
    try {
      const response = await api.get("/opsgenie/alerts", {
        params: {
          start: toApiDate(shiftRange.start),
          end: toApiDate(shiftRange.end),
        },
      });
      const alerts = response.data;
      const visibleOpenAlerts = alerts
        .filter((alert) => (alert.status || "").toLowerCase() === "open")
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 50);
      const notesResponse = await api.post("/opsgenie/alert-notes", {
        alert_ids: visibleOpenAlerts.map((alert) => alert.alert_id),
      });
      const notesByAlert = notesResponse.data.notes || {};
      setShiftAlerts(alerts.map((alert) => ({
        ...alert,
        notes: notesByAlert[alert.alert_id] || alert.notes || null,
      })));
    } catch (err) {
      setAlertError(err.response?.data?.detail || "Unable to load shift alerts");
    } finally {
      setLoadingAlerts(false);
    }
  }

  useEffect(() => {
    loadShiftAlerts();
  }, [shiftDate, selectedShift]);

  async function sendHandover() {
    setSending(true);
    setMessage("");
    setSendError("");
    try {
      const response = await api.post("/handover/send", {
        notes,
        shift_type: selectedShiftLabel,
        shift_date: shiftDate,
        shift_start: shiftRange.start,
        shift_end: shiftRange.end,
        alerts: handoverAlerts,
      });
      setMessage(response.data.message);
      setOpen(false);
    } catch (err) {
      setSendError(err.response?.data?.detail || "Unable to send shift handover");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="glass-card">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6">Shift Handover</Typography>
              <Typography color="text.secondary">Only open alerts are shown for the selected shift on the selected day.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Refresh />} variant="outlined" onClick={loadShiftAlerts}>Refresh Alerts</Button>
              <Button variant="contained" onClick={() => setOpen(true)}>Add Notes & Send</Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Shift Date"
              type="date"
              value={shiftDate}
              onChange={(event) => setShiftDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl sx={{ minWidth: 260 }}>
              <InputLabel>Shift</InputLabel>
              <Select label="Shift" value={selectedShift} onChange={(event) => setSelectedShift(event.target.value)}>
                {SHIFT_OPTIONS.map((shift) => (
                  <MenuItem key={shift.id} value={shift.id}>{shift.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Shift Window" value={shiftRange.label} fullWidth InputProps={{ readOnly: true }} />
          </Stack>

          {loadingAlerts && <LinearProgress />}

          {message && <Alert severity="success">{message}</Alert>}
          {sendError && <Alert severity="error">{sendError}</Alert>}
          {alertError && <Alert severity="error">{alertError}</Alert>}

          <Grid container spacing={2}>
            <KpiCard label="Open Alerts" value={handoverAlerts.length} />
            <KpiCard label="Shift" value={selectedShiftLabel} />
            <KpiCard label="Start" value={formatIst(shiftRange.start)} />
            <KpiCard label="End" value={formatIst(shiftRange.end)} />
          </Grid>

          <DataTable
            rows={handoverAlerts.slice(0, 50)}
            columns={["Alert ID", "Message", "Notes", "Priority", "Status", "Source", "Created At (IST)", "Owner", "Open"]}
            render={(alert) => [
              alert.alert_id,
              alert.message,
              alert.notes,
              alert.priority,
              alert.status,
              alert.source,
              formatIst(alert.created_at),
              alert.owner,
              alert.alert_url ? <Button key={`${alert.alert_id}-open`} size="small" startIcon={<Launch />} href={alert.alert_url} target="_blank" rel="noreferrer">Opsgenie</Button> : "-",
            ]}
          />
        </Stack>
      </CardContent>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ className: `handover-dialog-paper ${mode === "light" ? "light-dialog-paper" : ""}` }}
      >
        <DialogTitle>Shift Handover Notes</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              This sends {handoverAlerts.length} open alerts and your notes to Google Chat via the backend webhook.
            </Alert>
            <TextField
              label="Handover Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              fullWidth
              multiline
              minRows={6}
              placeholder="Add summary, risks, follow-ups, owner notes, and pending actions..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendHandover} disabled={sending}>
            {sending ? "Sending..." : "Send to Google Chat"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

function SelectField({ label, value, setValue, options }) {
  return (
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => setValue(e.target.value)}>
        {options.map((option) => <MenuItem key={option || "all"} value={option}>{option || "All"}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

function DataTable({ rows, columns, render }) {
  if (!rows.length) return <EmptyState text="No records available for this view." />;
  return (
    <Box className="table-wrap">
      <Table size="small">
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
        <TableBody>{rows.map((row, index) => <TableRow key={row.id || row.alert_id || index}>{render(row).map((value, cellIndex) => <TableCell key={cellIndex}>{value || "-"}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </Box>
  );
}

function EditDialog({ title, open, onClose, onSave, children }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>{children}</Stack></DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={onSave}>Save</Button></DialogActions>
    </Dialog>
  );
}

function EmptyState({ text }) {
  return <Box className="empty-state"><Typography>{text}</Typography></Box>;
}

export default App;
