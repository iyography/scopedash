"use client";

import { useEffect, useState, useMemo } from "react";

// Types
interface Stats { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number; }
interface Video { id: string; desc: string; createTime: number; stats: Stats; coverUrl: string; author: string; }
interface Profile { name: string; avatar: string; fans: number; videos: Video[]; }
interface Data { metadata: { last_updated: string }; profiles: Record<string, Profile>; all_videos: Video[]; }

const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n);


// ============================================================
// DASHBOARD COMPONENT
// ============================================================
function Dashboard({ data, profiles, videos, topIds, metrics, onRefresh, refreshing }: ViewProps) {
  const [activeProfile, setActiveProfile] = useState("all");
  const [sortBy, setSortBy] = useState<"views" | "likes" | "comments" | "date">("views");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

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
          <button onClick={onRefresh} disabled={refreshing} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: "6px 10px", cursor: refreshing ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: c.textMuted, opacity: refreshing ? 0.6 : 1 }}>
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
              {(["views", "likes", "comments", "date"] as const).map(key => (
                <button key={key} onClick={() => { if (sortBy === key) setSortAsc(!sortAsc); else { setSortBy(key); setSortAsc(false); } }} style={{ background: sortBy === key ? c.accent : c.bg, border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 10, color: sortBy === key ? "#fff" : c.textMuted, textTransform: "capitalize" }}>
                  {key} {sortBy === key && (sortAsc ? "↑" : "↓")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 16, display: viewMode === "grid" ? "grid" : "flex", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(220px, 1fr))" : undefined, flexDirection: viewMode === "list" ? "column" : undefined, gap: viewMode === "grid" ? 20 : 8 }}>
            {filteredVideos.map(v => viewMode === "grid" ? (
              <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                {topIds.has(v.id) && <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "linear-gradient(135deg, #f59e0b, #ef4444)", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#fff" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>TOP</div>}
                <div style={{ aspectRatio: "9/16", position: "relative", background: c.bgHover }}>
                  {v.coverUrl && <img src={v.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "crisp-edges" }} />}
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
            ) : (
              // List view
              <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 8, padding: 12, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12, position: "relative" }} onMouseEnter={e => e.currentTarget.style.background = c.bgHover} onMouseLeave={e => e.currentTarget.style.background = c.bgAlt}>
                {topIds.has(v.id) && <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, background: "linear-gradient(135deg, #f59e0b, #ef4444)", padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 700, color: "#fff" }}><svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>TOP</div>}
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", background: c.bgHover, flexShrink: 0 }}>
                  {v.coverUrl && <img src={v.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "crisp-edges" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 }}>@{v.author}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{v.desc || "—"}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: c.textMuted }}>
                    <span><strong style={{ color: c.text }}>{fmt(v.stats.playCount)}</strong> views</span>
                    <span><strong style={{ color: c.text }}>{fmt(v.stats.diggCount)}</strong> likes</span>
                    <span><strong style={{ color: c.text }}>{fmt(v.stats.commentCount)}</strong> comments</span>
                    <span><strong style={{ color: c.text }}>{fmt(v.stats.shareCount)}</strong> shares</span>
                  </div>
                </div>
              </div>
            ))}
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
// MAIN PAGE COMPONENT
// ============================================================
interface ViewProps {
  data: Data;
  profiles: Profile[];
  videos: Video[];
  topIds: Set<string>;
  metrics: { views: number; likes: number; comments: number; followers: number };
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export default function Page() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch("/data.json").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        console.error("Refresh failed:", result.error);
        alert("Refresh failed: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      console.error("Refresh failed:", e);
      alert("Refresh failed - check console for details");
    } finally {
      setRefreshing(false);
    }
  };

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

  const viewProps: ViewProps = { data, profiles, videos, topIds, metrics, onRefresh: handleRefresh, refreshing };

  return <Dashboard {...viewProps} />;
}