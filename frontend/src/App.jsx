import { useState, useEffect } from "react";
import axios from "axios";

import StatCards      from "./components/StatCards";
import RevenueChart   from "./components/RevenueChart";
import PeakHours      from "./components/PeakHours";
import TopProducts    from "./components/TopProducts";
import CategoryPie    from "./components/CategoryPie";
import LocationBar    from "./components/LocationBar";
import CustomerView   from "./components/CustomerView";
import MenuComparison from "./components/MenuComparison";
import StockPrep      from "./components/StockPrep";
import HeatMap        from "./components/HeatMap";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const LOCATIONS = ["All", "Astoria", "Hell's Kitchen", "Lower Manhattan"];

const DEFAULT_MENU = [
  { id: 1, name: "Cold Brew",    price: "5.50", dailySales: "35" },
  { id: 2, name: "Matcha Latte", price: "6.00", dailySales: "22" },
  { id: 3, name: "Iced Latte",   price: "5.00", dailySales: "40" },
];

const TABS = [
  { id: "owner",    label: "Dashboard"       },
  { id: "customer", label: "What's Popular?" },
  { id: "stock",    label: "Stock & Prep"    },
  { id: "menu",     label: "My Menu vs NYC"  },
];

// ── Responsive hook ───────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: "0.75rem", color: "#555", textTransform: "uppercase",
                 letterSpacing: "0.14em", margin: "2rem 0 0.75rem", fontWeight: 500 }}>
      {children}
    </h2>
  );
}

function FilterBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "0.35rem 0.9rem",
      border: `1px solid ${active ? "#c8956c" : "#2a2218"}`,
      borderRadius: "20px",
      background: active ? "rgba(200,149,108,0.15)" : "transparent",
      color: active ? "#c8956c" : "#555",
      cursor: "pointer",
      fontSize: "0.78rem",
      fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
      whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [view, setView]         = useState("owner");
  const [location, setLocation] = useState("All");
  const [overview, setOverview] = useState(null);
  const [topProducts, setTopP]  = useState([]);
  const [peakHours, setPeak]    = useState([]);
  const [byLocation, setByLoc]  = useState([]);
  const [byMonth, setByMonth]   = useState([]);
  const [byDay, setByDay]       = useState([]);
  const [byCategory, setByCat]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [menu, setMenu]         = useState(DEFAULT_MENU);
  const [nextId, setNextId]     = useState(4);
  const [menuView, setMenuView] = useState("table");

  const loc = location === "All" ? null : location;

  useEffect(() => {
    setLoading(true);
    const p = loc ? { location: loc } : {};
    Promise.all([
      axios.get(`${API}/overview`,            { params: p }),
      axios.get(`${API}/top-products`,        { params: { ...p, limit: 10 } }),
      axios.get(`${API}/peak-hours`,          { params: p }),
      axios.get(`${API}/revenue-by-location`),
      axios.get(`${API}/revenue-by-month`,    { params: p }),
      axios.get(`${API}/revenue-by-day`,      { params: p }),
      axios.get(`${API}/revenue-by-category`, { params: p }),
    ]).then(([ov, tp, ph, bl, bm, bd, bc]) => {
      setOverview(ov.data);
      setTopP(tp.data);
      setPeak(ph.data);
      setByLoc(bl.data);
      setByMonth(bm.data);
      setByDay(bd.data);
      setByCat(bc.data);
      setLoading(false);
    });
  }, [location]);

  // Close mobile menu when tab changes
  useEffect(() => { setMenuOpen(false); }, [view]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0906",
      color: "#f0ebe6",
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden",   // ← prevents horizontal scroll
      backgroundImage: `
        linear-gradient(rgba(200,149,108,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200,149,108,0.03) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
    }}>

      {/* ── Header ── */}
      <header style={{
        background: "rgba(10,9,6,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #1e1a16",
        padding: isMobile ? "0 1rem" : "0 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: "0.5rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
        minHeight: "56px",
      }}>
        {/* Logo */}
        <div style={{ padding: "0.75rem 0", flexShrink: 0 }}>
          <h1 style={{ fontSize: isMobile ? "1rem" : "1.2rem", fontWeight: 700,
                       margin: 0, color: "#f0ebe6", letterSpacing: "0.01em" }}>
            NYC Cafe Analytics
          </h1>
          {!isMobile && (
            <p style={{ fontSize: "0.68rem", color: "#6b5c4e", margin: "0.2rem 0 0" }}>
              Maven Roasters · Astoria · Hell's Kitchen · Lower Manhattan
            </p>
          )}
        </div>

        {/* Desktop tabs */}
        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "stretch", gap: 0, flex: 1,
                        justifyContent: "center" }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  padding: "0 1.1rem",
                  height: "56px",
                  border: "none",
                  borderBottom: `2px solid ${view === tab.id ? "#c8956c" : "transparent"}`,
                  background: "transparent",
                  color: view === tab.id ? "#c8956c" : "#3a3028",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: view === tab.id ? 600 : 400,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (view !== tab.id) e.target.style.color = "#888"; }}
                onMouseLeave={e => { if (view !== tab.id) e.target.style.color = "#3a3028"; }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* Desktop built by */}
        {!isMobile && (
          <span style={{ fontSize: "0.68rem", color: "#6b5c4e", flexShrink: 0 }}>
            Built by{" "}
            <a href="https://github.com/TheofficialCAguilar" target="_blank"
               rel="noopener noreferrer"
               style={{ color: "#c8956c", textDecoration: "none", fontWeight: 600 }}>
              Carlos Aguilar
            </a>
          </span>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "transparent", border: "1px solid #2a2218",
              borderRadius: "6px", padding: "0.4rem 0.6rem",
              color: "#c8956c", cursor: "pointer", fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        )}
      </header>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          background: "rgba(10,9,6,0.98)",
          borderBottom: "1px solid #1e1a16",
          padding: "0.5rem 1rem 1rem",
          position: "sticky",
          top: "56px",
          zIndex: 99,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "0.75rem 0.5rem",
                border: "none",
                borderBottom: "1px solid #1a1614",
                background: "transparent",
                color: view === tab.id ? "#c8956c" : "#888",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: view === tab.id ? 600 : 400,
              }}
            >
              {view === tab.id ? "→ " : ""}{tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Owner Dashboard ── */}
      {view === "owner" && (
        <div style={{
          padding: isMobile ? "1rem" : "1.5rem 2rem",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}>

          {/* Location filter — scrollable on mobile */}
          <div style={{
            display: "flex", gap: "0.5rem", flexWrap: isMobile ? "nowrap" : "wrap",
            marginBottom: "1.5rem", alignItems: "center",
            overflowX: isMobile ? "auto" : "visible",
            paddingBottom: isMobile ? "0.25rem" : 0,
            msOverflowStyle: "none", scrollbarWidth: "none",
          }}>
            <span style={{ fontSize: "0.68rem", color: "#3a3028", textTransform: "uppercase",
                           letterSpacing: "0.1em", marginRight: "0.25rem",
                           flexShrink: 0 }}>Location</span>
            {LOCATIONS.map(l => (
              <FilterBtn key={l} label={l} active={location === l}
                         onClick={() => setLocation(l)} />
            ))}
          </div>

          {loading
            ? <p style={{ color: "#2a2218", textAlign: "center", padding: "4rem" }}>
                Loading data…
              </p>
            : <>
                <StatCards overview={overview} location={location} />

                <SectionTitle>How the money moved</SectionTitle>
                <RevenueChart data={byMonth} />

                {/* Two col → single col on mobile */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "1.5rem",
                }}>
                  <div>
                    <SectionTitle>When the rush hits</SectionTitle>
                    <PeakHours data={peakHours} />
                  </div>
                  <div>
                    <SectionTitle>Best days of the week</SectionTitle>
                    <div style={{ background: "#111", border: "1px solid #1e1a16",
                                  borderRadius: "8px", padding: "1rem" }}>
                      {byDay.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center",
                                              gap: "0.75rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "#555", width: "32px",
                                         flexShrink: 0 }}>
                            {d.day_of_week.slice(0, 3)}
                          </span>
                          <div style={{ flex: 1, background: "#1a1614", borderRadius: "3px",
                                        height: "8px", minWidth: 0 }}>
                            <div style={{
                              width: `${(d.total_revenue / Math.max(...byDay.map(x => x.total_revenue))) * 100}%`,
                              background: "#c8956c", height: "8px", borderRadius: "3px",
                              transition: "width 0.4s ease",
                            }} />
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "#555",
                                         width: "50px", textAlign: "right", flexShrink: 0 }}>
                            ${(d.total_revenue / 1000).toFixed(1)}k
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "1.5rem",
                }}>
                  <div>
                    <SectionTitle>What people actually order</SectionTitle>
                    <TopProducts data={topProducts} />
                  </div>
                  <div>
                    <SectionTitle>Where the money comes from</SectionTitle>
                    <CategoryPie data={byCategory} />
                  </div>
                </div>

                <SectionTitle>Location breakdown</SectionTitle>
                <LocationBar data={byLocation} />

                <SectionTitle>When customers show up</SectionTitle>
                {isMobile ? (
                  <div style={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    WebkitOverflowScrolling: "touch",
                    borderRadius: "8px",
                    border: "1px solid #1e1a16",
                    background: "#111",
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                  }}>
                    <div style={{ minWidth: "600px" }}>
                      <HeatMap location={location} />
                    </div>
                  </div>
                ) : (
                  <HeatMap location={location} />
                )}
              </>
          }
        </div>
      )}

      {/* ── Other views ── */}
      {view === "customer" && <CustomerView />}
      {view === "stock"    && <StockPrep />}
      {view === "menu"     && (
        <MenuComparison
          menu={menu}
          setMenu={setMenu}
          nextId={nextId}
          setNextId={setNextId}
          menuView={menuView}
          setMenuView={setMenuView}
        />
      )}

      <footer style={{
        textAlign: "center",
        padding: isMobile ? "1.5rem 1rem" : "2rem",
        color: "#6b5c4e",
        fontSize: "0.72rem",
        borderTop: "1px solid #1e1a16",
        marginTop: "2rem",
      }}>
        <p style={{ margin: "0 0 0.25rem" }}>
          NYC Cafe Analytics · Inspired by Stephanie 🤎
        </p>
        <p style={{ margin: 0, color: "#3a3028" }}>
          © {new Date().getFullYear()} Carlos Aguilar · Data: Maven Roasters 2023 · For educational and portfolio purposes only
        </p>
      </footer>
    </div>
  );
}