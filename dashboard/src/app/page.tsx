"use client";

import { useEffect, useState, useMemo } from "react";

// Types
interface Stats { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number; }
interface Video { id: string; desc: string; createTime: number; stats: Stats; coverUrl: string; author: string; }
interface Profile { name: string; avatar: string; fans: number; videos: Video[]; }
interface Data { metadata: { last_updated: string }; profiles: Record<string, Profile>; all_videos: Video[]; }

const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n);

// View Toggle Component (bottom left - vertical)
function ViewToggle({ current, onChange }: { current: number; onChange: (v: number) => void }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: 20,
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      background: "rgba(0,0,0,0.85)",
      padding: 8,
      borderRadius: 12,
      backdropFilter: "blur(10px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      {[1, 2, 3, 4].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            background: current === v ? "#fff" : "transparent",
            color: current === v ? "#000" : "#888",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "left",
          }}
        >
          View {v}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// VIEW 1: Professional Dark Dashboard (Current design refined)
// ============================================================
function View1({ data, profiles, videos, topIds, metrics }: ViewProps) {
  const [activeProfile, setActiveProfile] = useState("all");
  const [sortBy, setSortBy] = useState<"views" | "likes" | "top" | "comments" | "date">("top");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      window.location.reload();
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredVideos = useMemo(() => {
    let list = activeProfile === "all" ? data.all_videos : data.profiles[activeProfile]?.videos || [];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(v => v.desc?.toLowerCase().includes(q) || v.author?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const getValue = (v: Video) => {
        switch (sortBy) {
          case "views": return v.stats.playCount;
          case "likes": return v.stats.diggCount;
          case "top": return v.stats.playCount > 0 ? ((v.stats.diggCount + v.stats.commentCount + v.stats.shareCount) / v.stats.playCount) * 100 : 0;
          case "comments": return v.stats.commentCount;
          case "date": return v.createTime;
        }
      };
      return sortAsc ? getValue(a) - getValue(b) : getValue(b) - getValue(a);
    });
  }, [data, activeProfile, query, sortBy, sortAsc]);

  const c = isDark
    ? { bg: "#09090b", bgAlt: "#18181b", bgHover: "#27272a", border: "#27272a", text: "#fafafa", textMuted: "#71717a", textDim: "#52525b", accent: "#3b82f6", red: "#ef4444", green: "#22c55e", yellow: "#eab308" }
    : { bg: "#ffffff", bgAlt: "#f4f4f5", bgHover: "#e4e4e7", border: "#e4e4e7", text: "#09090b", textMuted: "#71717a", textDim: "#a1a1aa", accent: "#3b82f6", red: "#ef4444", green: "#22c55e", yellow: "#eab308" };

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: c.bg, color: c.text, fontSize: 13 }}>
      <header style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: c.bgAlt, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/sd-logo.png" alt="ScopeDash" height={28} style={{ display: "block", maxWidth: 150 }} />
          <span style={{ fontSize: 11, color: c.textDim, background: c.bg, padding: "3px 8px", borderRadius: 4 }}>{filteredVideos.length} videos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* List/Grid toggle */}
          <div style={{ display: "flex", background: c.bg, borderRadius: 6, padding: 2 }}>
            <button onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? c.accent : "transparent", border: "none", borderRadius: 4, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: viewMode === "list" ? "#fff" : c.textMuted }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              List
            </button>
            <button onClick={() => setViewMode("grid")} style={{ background: viewMode === "grid" ? c.accent : "transparent", border: "none", borderRadius: 4, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: viewMode === "grid" ? "#fff" : c.textMuted }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Grid
            </button>
          </div>
          {/* Refresh button */}
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: "6px 10px", cursor: refreshing ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: c.textMuted, opacity: refreshing ? 0.6 : 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            {refreshing ? "..." : "Refresh"}
          </button>
          {/* Dark/Light toggle */}
          <button onClick={() => setIsDark(!isDark)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4 }}>
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Stats Cards - Vibrant gradient style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "16px 20px", background: c.bgAlt, borderBottom: `1px solid ${c.border}` }}>
        {[
          { label: "Total Views", value: metrics.views, icon: "👁️", gradient: gradients[0] },
          { label: "Total Likes", value: metrics.likes, icon: "❤️", gradient: gradients[1] },
          { label: "Comments", value: metrics.comments, icon: "💬", gradient: gradients[2] },
          { label: "Followers", value: metrics.followers, icon: "👥", gradient: gradients[3] },
        ].map(s => (
          <div key={s.label} style={{ background: s.gradient, borderRadius: 16, padding: 20, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)"; }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{fmt(s.value)}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: 200, background: c.bgAlt, borderRight: `1px solid ${c.border}`, overflow: "auto", padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: c.textDim, textTransform: "uppercase", marginBottom: 8 }}>Profiles</div>
          <button onClick={() => setActiveProfile("all")} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "none", textAlign: "left", cursor: "pointer", fontSize: 12, background: activeProfile === "all" ? c.accent : "transparent", color: activeProfile === "all" ? "#fff" : c.textMuted, marginBottom: 4 }}>All</button>
          {profiles.map(p => (
            <button key={p.name} onClick={() => setActiveProfile(p.name)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: activeProfile === p.name ? c.accent : "transparent", color: activeProfile === p.name ? "#fff" : c.textMuted, marginBottom: 2 }}>
              <img src={p.avatar} alt="" width={20} height={20} style={{ borderRadius: "50%", objectFit: "cover" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{p.name}</span>
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: c.bgAlt, borderBottom: `1px solid ${c.border}` }}>
            <input type="text" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} style={{ width: 200, height: 30, padding: "0 10px", borderRadius: 6, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 12 }} />
            <div style={{ display: "flex", gap: 4 }}>
              {(["views", "likes", "top", "comments", "date"] as const).map(key => (
                <button key={key} onClick={() => { if (sortBy === key) setSortAsc(!sortAsc); else { setSortBy(key); setSortAsc(false); } }} style={{ background: sortBy === key ? c.accent : c.bg, border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 10, color: sortBy === key ? "#fff" : c.textMuted, textTransform: "capitalize" }}>
                  {key} {sortBy === key && (sortAsc ? "↑" : "↓")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {viewMode === "list" ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: c.textMuted, borderBottom: `1px solid ${c.border}`, background: c.bgAlt, position: "sticky", top: 0, width: 40 }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: c.textMuted, borderBottom: `1px solid ${c.border}`, background: c.bgAlt, position: "sticky", top: 0 }}>Video</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: c.textMuted, borderBottom: `1px solid ${c.border}`, background: c.bgAlt, position: "sticky", top: 0, width: 100 }}>Author</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 10, color: c.textMuted, borderBottom: `1px solid ${c.border}`, background: c.bgAlt, position: "sticky", top: 0, width: 80 }}>Views</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 10, color: c.textMuted, borderBottom: `1px solid ${c.border}`, background: c.bgAlt, position: "sticky", top: 0, width: 70 }}>Likes</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 10, color: c.textMuted, borderBottom: `1px solid ${c.border}`, background: c.bgAlt, position: "sticky", top: 0, width: 70 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((v, i) => (
                    <tr key={v.id} onClick={() => setSelected(v)} style={{ cursor: "pointer", background: selected?.id === v.id ? c.bgHover : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = c.bgHover} onMouseLeave={e => e.currentTarget.style.background = selected?.id === v.id ? c.bgHover : "transparent"}>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${c.border}`, color: c.textDim }}>{i + 1}</td>
                      <td style={{ padding: "8px 8px 8px 12px", borderBottom: `1px solid ${c.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 32, height: 45, borderRadius: 4, overflow: "hidden", background: c.bgHover, flexShrink: 0, position: "relative" }}>
                            {v.coverUrl && <img src={v.coverUrl} alt="" width={32} height={45} style={{ objectFit: "cover" }} />}
                            {topIds.has(v.id) && <div style={{ position: "absolute", top: 2, left: 2, background: "linear-gradient(135deg, #f59e0b, #ef4444)", borderRadius: 2, padding: 2, display: "flex" }}><svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>}
                          </div>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{v.desc || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px 8px 4px", borderBottom: `1px solid ${c.border}`, color: c.textMuted, fontSize: 11 }}>@{v.author}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${c.border}`, textAlign: "right", color: c.accent, fontWeight: 600, fontSize: 12 }}>{fmt(v.stats.playCount)}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${c.border}`, textAlign: "right", color: c.textMuted, fontSize: 11 }}>{fmt(v.stats.diggCount)}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${c.border}`, textAlign: "right", color: c.textDim, fontSize: 11 }}>{new Date(v.createTime * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                {filteredVideos.map(v => (
                  <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                    {topIds.has(v.id) && <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "linear-gradient(135deg, #f59e0b, #ef4444)", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#fff" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>TOP</div>}
                    <div style={{ aspectRatio: "9/16", position: "relative", background: c.bgHover }}>
                      {v.coverUrl && <img src={v.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 8px 8px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", display: "flex", justifyContent: "space-around" }}>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{fmt(v.stats.playCount)}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>views</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{fmt(v.stats.diggCount)}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>likes</div></div>
                      </div>
                    </div>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: c.text, marginBottom: 2 }}>@{v.author}</div>
                      <div style={{ fontSize: 10, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.desc || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {selected && (
          <aside style={{ width: 280, background: c.bgAlt, borderLeft: `1px solid ${c.border}`, overflow: "auto", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: c.textDim, textTransform: "uppercase" }}>Details</span>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: c.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ aspectRatio: "9/16", borderRadius: 8, overflow: "hidden", background: c.bgHover, marginBottom: 16 }}>
              {selected.coverUrl && <img src={selected.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>@{selected.author}</div>
            <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 16, lineHeight: 1.5 }}>{selected.desc || "—"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[{ label: "Views", value: selected.stats.playCount, color: c.accent }, { label: "Likes", value: selected.stats.diggCount, color: c.red }, { label: "Comments", value: selected.stats.commentCount, color: c.green }, { label: "Shares", value: selected.stats.shareCount, color: c.yellow }].map(s => (
                <div key={s.label} style={{ background: c.bg, padding: 10, borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: c.textDim }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{fmt(s.value)}</div>
                </div>
              ))}
            </div>
            <a href={`https://www.tiktok.com/@${selected.author}/video/${selected.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "10px 0", textAlign: "center", background: c.accent, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Open in TikTok</a>
          </aside>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VIEW 2: Bright & Playful - Gradient cards, vibrant colors
// ============================================================
function View2({ data, profiles, videos, topIds, metrics }: ViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "trending" | "recent">("all");

  const displayVideos = useMemo(() => {
    let list = [...videos];
    if (filter === "trending") list.sort((a, b) => b.stats.diggCount - a.stats.diggCount);
    if (filter === "recent") list.sort((a, b) => b.createTime - a.createTime);
    return list.slice(0, 50);
  }, [videos, filter]);

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", padding: 30 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: "#2d3436", margin: 0, letterSpacing: -1 }}>TikTok Analytics</h1>
            <p style={{ fontSize: 16, color: "#636e72", marginTop: 8 }}>Your content performance at a glance ✨</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {(["all", "trending", "recent"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#6c5ce7" : "#fff", color: filter === f ? "#fff" : "#6c5ce7", border: "none", borderRadius: 25, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(108, 92, 231, 0.2)", textTransform: "capitalize" }}>{f === "all" ? "All Videos" : f}</button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          {[
            { label: "Total Views", value: metrics.views, icon: "👁️", gradient: gradients[0] },
            { label: "Total Likes", value: metrics.likes, icon: "❤️", gradient: gradients[1] },
            { label: "Comments", value: metrics.comments, icon: "💬", gradient: gradients[2] },
            { label: "Followers", value: metrics.followers, icon: "👥", gradient: gradients[3] },
          ].map(s => (
            <div key={s.label} style={{ background: s.gradient, borderRadius: 24, padding: 28, color: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>{fmt(s.value)}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Video Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          {displayVideos.map((v, i) => (
            <div
              key={v.id}
              onMouseEnter={() => setHoveredId(v.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: hoveredId === v.id ? "0 20px 60px rgba(108, 92, 231, 0.3)" : "0 5px 20px rgba(0,0,0,0.08)",
                transform: hoveredId === v.id ? "translateY(-10px) scale(1.02)" : "none",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            >
              <div style={{ aspectRatio: "9/16", position: "relative", background: gradients[i % gradients.length] }}>
                {v.coverUrl && <img src={v.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {topIds.has(v.id) && (
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#fff", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#6c5ce7", display: "flex", alignItems: "center", gap: 4 }}>⚡ HOT</div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "40px 16px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-around", color: "#fff" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>👁️ {fmt(v.stats.playCount)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>❤️ {fmt(v.stats.diggCount)}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2d3436", marginBottom: 4 }}>@{v.author}</div>
                <div style={{ fontSize: 12, color: "#636e72", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.desc || "No description"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VIEW 3: Minimal Editorial - Black & white, typography focus
// ============================================================
function View3({ data, profiles, videos, topIds, metrics }: ViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"performance" | "chronological">("performance");

  const sortedVideos = useMemo(() => {
    const list = [...videos];
    if (sortMode === "chronological") list.sort((a, b) => b.createTime - a.createTime);
    else list.sort((a, b) => b.stats.playCount - a.stats.playCount);
    return list;
  }, [videos, sortMode]);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Georgia', serif" }}>
      {/* Hero Header */}
      <header style={{ background: "#000", color: "#fff", padding: "80px 60px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20, opacity: 0.6 }}>Analytics Report</div>
          <h1 style={{ fontSize: 72, fontWeight: 400, margin: 0, lineHeight: 1.1, fontStyle: "italic" }}>Content Performance</h1>
          <div style={{ display: "flex", gap: 60, marginTop: 50 }}>
            {[
              { label: "Views", value: metrics.views },
              { label: "Engagement", value: metrics.likes },
              { label: "Conversations", value: metrics.comments },
              { label: "Audience", value: metrics.followers },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 48, fontWeight: 300, fontStyle: "italic" }}>{fmt(s.value)}</div>
                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: 0.5, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, borderBottom: "1px solid #000", paddingBottom: 20 }}>
          <span style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase" }}>All Videos</span>
          <div style={{ display: "flex", gap: 20 }}>
            {(["performance", "chronological"] as const).map(m => (
              <button key={m} onClick={() => setSortMode(m)} style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", color: sortMode === m ? "#000" : "#999", textDecoration: sortMode === m ? "underline" : "none", textUnderlineOffset: 4, textTransform: "capitalize" }}>{m}</button>
            ))}
          </div>
        </div>

        {sortedVideos.map((v, i) => (
          <article
            key={v.id}
            onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
            style={{ borderBottom: "1px solid #e0e0e0", padding: "30px 0", cursor: "pointer" }}
          >
            <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
              <div style={{ fontSize: 14, color: "#999", width: 30 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 400, margin: 0, fontStyle: "italic" }}>@{v.author}</h3>
                    <p style={{ fontSize: 14, color: "#666", marginTop: 8, lineHeight: 1.6 }}>{v.desc || "—"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 300 }}>{fmt(v.stats.playCount)}</div>
                    <div style={{ fontSize: 11, color: "#999", letterSpacing: 1, textTransform: "uppercase" }}>views</div>
                  </div>
                </div>
                {expandedId === v.id && (
                  <div style={{ marginTop: 30, display: "flex", gap: 40 }}>
                    <div style={{ width: 120, aspectRatio: "9/16", background: "#eee", overflow: "hidden" }}>
                      {v.coverUrl && <img src={v.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                        {[
                          { label: "Likes", value: v.stats.diggCount },
                          { label: "Comments", value: v.stats.commentCount },
                          { label: "Shares", value: v.stats.shareCount },
                        ].map(s => (
                          <div key={s.label}>
                            <div style={{ fontSize: 24, fontWeight: 300 }}>{fmt(s.value)}</div>
                            <div style={{ fontSize: 10, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 20, fontSize: 12, color: "#999" }}>
                        Published {new Date(v.createTime * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </div>
                      <a href={`https://www.tiktok.com/@${v.author}/video/${v.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 20, fontSize: 12, color: "#000", letterSpacing: 1, textTransform: "uppercase", textDecoration: "underline", textUnderlineOffset: 4 }}>View on TikTok →</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VIEW 4: Neon Cyberpunk - Dark with glowing accents
// ============================================================
function View4({ data, profiles, videos, topIds, metrics }: ViewProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [glowHover, setGlowHover] = useState<string | null>(null);

  const authorStats = useMemo(() => {
    const stats: Record<string, { videos: number; views: number; likes: number; engagement: number }> = {};
    videos.forEach(v => {
      if (!stats[v.author]) stats[v.author] = { videos: 0, views: 0, likes: 0, engagement: 0 };
      stats[v.author].videos++;
      stats[v.author].views += v.stats.playCount;
      stats[v.author].likes += v.stats.diggCount;
    });
    Object.keys(stats).forEach(a => {
      stats[a].engagement = stats[a].views > 0 ? (stats[a].likes / stats[a].views) * 100 : 0;
    });
    return stats;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (!selectedAuthor) return videos.slice(0, 30);
    return videos.filter(v => v.author === selectedAuthor);
  }, [videos, selectedAuthor]);

  const neon = { pink: "#ff00ff", cyan: "#00ffff", yellow: "#ffff00", green: "#00ff00" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'Courier New', monospace" }}>
      {/* Scanlines overlay */}
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)", pointerEvents: "none", zIndex: 100 }} />

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${neon.cyan}`, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 0 30px ${neon.cyan}40` }}>
        <div>
          <div style={{ fontSize: 10, color: neon.cyan, letterSpacing: 4, marginBottom: 4 }}>SYSTEM://</div>
          <div style={{ fontSize: 28, fontWeight: 700, textShadow: `0 0 20px ${neon.pink}`, color: neon.pink }}>SCOPE_DASH.exe</div>
        </div>
        <div style={{ display: "flex", gap: 30 }}>
          {[
            { label: "VIEWS", value: metrics.views, color: neon.cyan },
            { label: "LIKES", value: metrics.likes, color: neon.pink },
            { label: "COMMENTS", value: metrics.comments, color: neon.yellow },
            { label: "FOLLOWERS", value: metrics.followers, color: neon.green },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, textShadow: `0 0 15px ${s.color}` }}>{fmt(s.value)}</div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: "flex" }}>
        {/* Sidebar - Author Matrix */}
        <aside style={{ width: 280, borderRight: `1px solid ${neon.pink}30`, padding: 20, boxShadow: `inset -20px 0 40px ${neon.pink}10` }}>
          <div style={{ fontSize: 10, color: neon.pink, letterSpacing: 3, marginBottom: 20 }}>[ CREATOR_MATRIX ]</div>
          <button onClick={() => setSelectedAuthor(null)} style={{ display: "block", width: "100%", background: !selectedAuthor ? `${neon.cyan}20` : "transparent", border: `1px solid ${!selectedAuthor ? neon.cyan : "#333"}`, color: !selectedAuthor ? neon.cyan : "#666", padding: "10px 12px", marginBottom: 8, cursor: "pointer", fontSize: 11, textAlign: "left", transition: "all 0.2s" }}>
            &gt; ALL_CREATORS [{videos.length}]
          </button>
          {profiles.map(p => (
            <button
              key={p.name}
              onClick={() => setSelectedAuthor(p.name)}
              onMouseEnter={() => setGlowHover(p.name)}
              onMouseLeave={() => setGlowHover(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                background: selectedAuthor === p.name ? `${neon.pink}20` : glowHover === p.name ? `${neon.pink}10` : "transparent",
                border: `1px solid ${selectedAuthor === p.name ? neon.pink : glowHover === p.name ? neon.pink + "50" : "#222"}`,
                color: selectedAuthor === p.name ? neon.pink : "#888",
                padding: "8px 12px",
                marginBottom: 4,
                cursor: "pointer",
                fontSize: 10,
                textAlign: "left",
                transition: "all 0.2s",
                boxShadow: selectedAuthor === p.name ? `0 0 15px ${neon.pink}40` : "none",
              }}
            >
              <img src={p.avatar} alt="" width={24} height={24} style={{ borderRadius: 4, border: `1px solid ${neon.cyan}50` }} />
              <div>
                <div>@{p.name}</div>
                <div style={{ fontSize: 9, color: "#555" }}>{authorStats[p.name]?.videos || 0} files</div>
              </div>
            </button>
          ))}
        </aside>

        {/* Main Grid */}
        <main style={{ flex: 1, padding: 30 }}>
          <div style={{ fontSize: 10, color: neon.yellow, letterSpacing: 3, marginBottom: 20 }}>[ VIDEO_STREAM ] — {filteredVideos.length} entries</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {filteredVideos.map(v => (
              <div
                key={v.id}
                onMouseEnter={() => setGlowHover(v.id)}
                onMouseLeave={() => setGlowHover(null)}
                style={{
                  background: "#111",
                  border: `1px solid ${topIds.has(v.id) ? neon.yellow : glowHover === v.id ? neon.cyan : "#222"}`,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: glowHover === v.id ? `0 0 25px ${neon.cyan}40, inset 0 0 20px ${neon.cyan}10` : topIds.has(v.id) ? `0 0 15px ${neon.yellow}30` : "none",
                }}
              >
                <div style={{ aspectRatio: "9/16", position: "relative", background: "#0a0a0a" }}>
                  {v.coverUrl && <img src={v.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: glowHover === v.id ? 1 : 0.7, transition: "opacity 0.2s" }} />}
                  {topIds.has(v.id) && (
                    <div style={{ position: "absolute", top: 4, left: 4, background: "#000", border: `1px solid ${neon.yellow}`, padding: "2px 6px", fontSize: 8, color: neon.yellow, letterSpacing: 1 }}>⚡TOP</div>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, #000)", padding: "20px 8px 8px" }}>
                    <div style={{ fontSize: 10, color: neon.cyan }}>{fmt(v.stats.playCount)}</div>
                    <div style={{ fontSize: 8, color: "#555" }}>views</div>
                  </div>
                </div>
                <div style={{ padding: 8, borderTop: `1px solid #222` }}>
                  <div style={{ fontSize: 9, color: neon.pink, marginBottom: 2 }}>@{v.author}</div>
                  <div style={{ fontSize: 8, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.desc || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
interface ViewProps {
  data: Data;
  profiles: Profile[];
  videos: Video[];
  topIds: Set<string>;
  metrics: { views: number; likes: number; comments: number; followers: number };
}

export default function Page() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState(1);

  useEffect(() => {
    fetch("/data.json").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const profiles = useMemo(() => data ? Object.values(data.profiles) : [], [data]);
  const videos = useMemo(() => data?.all_videos || [], [data]);

  const topIds = useMemo(() => {
    if (!videos.length) return new Set<string>();
    const withEng = videos.map(v => ({
      id: v.id,
      eng: v.stats.playCount > 0 ? ((v.stats.diggCount + v.stats.commentCount + v.stats.shareCount) / v.stats.playCount) * 100 : 0
    }));
    withEng.sort((a, b) => b.eng - a.eng);
    const topN = Math.max(1, Math.ceil(videos.length * 0.1));
    return new Set(withEng.slice(0, topN).map(v => v.id));
  }, [videos]);

  const metrics = useMemo(() => ({
    views: videos.reduce((s, v) => s + v.stats.playCount, 0),
    likes: videos.reduce((s, v) => s + v.stats.diggCount, 0),
    comments: videos.reduce((s, v) => s + v.stats.commentCount, 0),
    followers: profiles.reduce((s, p) => s + p.fans, 0),
  }), [videos, profiles]);

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff" }}>Loading...</div>;
  if (!data) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff" }}>Error loading data</div>;

  const viewProps: ViewProps = { data, profiles, videos, topIds, metrics };

  return (
    <>
      <ViewToggle current={currentView} onChange={setCurrentView} />
      {currentView === 1 && <View1 {...viewProps} />}
      {currentView === 2 && <View2 {...viewProps} />}
      {currentView === 3 && <View3 {...viewProps} />}
      {currentView === 4 && <View4 {...viewProps} />}
    </>
  );
}
