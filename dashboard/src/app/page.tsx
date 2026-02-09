"use client";

import { useEffect, useState, useMemo } from "react";

// Global declaration for TikTok script
declare global {
  interface Window {
    tiktokEmbed: {
      lib?: {
        render: (element?: HTMLElement[]) => void;
      };
      load?: () => void;
    };
  }
}

// Types
interface Stats { diggCount: number; shareCount: number; commentCount: number; playCount: number; collectCount: number; }
interface Video { id: string; desc: string; createTime: number; stats: Stats; coverUrl: string; author: string; }
interface Profile { name: string; avatar: string; fans: number; videos: Video[]; }
interface Data { metadata: { last_updated: string }; profiles: Record<string, Profile>; all_videos: Video[]; }

const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n);


// ============================================================
// DASHBOARD COMPONENT
// ============================================================
function Dashboard({ data, profiles, videos, topIds, metrics, onRefresh, refreshing, showSettings, setShowSettings, apiKey, setApiKey }: ViewProps) {
  const [activeProfile, setActiveProfile] = useState("all");
  const [sortBy, setSortBy] = useState<"views" | "likes" | "comments" | "date">("views");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [currentView, setCurrentView] = useState<1 | 2 | 3 | 4>(1);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannels, setNewChannels] = useState("");

  const c = isDark
    ? { bg: "#09090b", bgAlt: "#18181b", bgHover: "#27272a", border: "#27272a", text: "#fafafa", textMuted: "#71717a", textDim: "#52525b", accent: "#3b82f6", red: "#ef4444", green: "#22c55e", yellow: "#eab308" }
    : { bg: "#ffffff", bgAlt: "#f4f4f5", bgHover: "#e4e4e7", border: "#e4e4e7", text: "#09090b", textMuted: "#71717a", textDim: "#a1a1aa", accent: "#3b82f6", red: "#ef4444", green: "#22c55e", yellow: "#eab308" };

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
          {/* Settings button */}
          <button onClick={() => setShowSettings(true)} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: c.textMuted }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="m12 1 10 4-10 4-10-4 10-4"/><path d="m12 7 10 4-10 4-10-4 10-4"/><path d="m12 13 10 4-10 4-10-4 10-4"/></svg>
            Settings
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
        <aside style={{ width: 200, background: c.bgAlt, borderRight: `1px solid ${c.border}`, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: c.textDim, textTransform: "uppercase", marginBottom: 8 }}>Profiles</div>
            <button onClick={() => setActiveProfile("all")} style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "none", textAlign: "left", cursor: "pointer", fontSize: 12, background: activeProfile === "all" ? c.accent : "transparent", color: activeProfile === "all" ? "#fff" : c.textMuted, marginBottom: 4 }}>All</button>
            {profiles.map(p => (
              <button key={p.name} onClick={() => setActiveProfile(p.name)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: activeProfile === p.name ? c.accent : "transparent", color: activeProfile === p.name ? "#fff" : c.textMuted, marginBottom: 2 }}>
                <img src={p.avatar} alt="" width={20} height={20} style={{ borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{p.name}</span>
              </button>
            ))}
            
            <button 
              onClick={() => setShowAddChannel(true)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                width: "100%", 
                padding: "6px 10px", 
                borderRadius: 6, 
                border: `1px dashed ${c.border}`, 
                cursor: "pointer", 
                fontSize: 11, 
                background: "transparent", 
                color: c.textMuted, 
                marginTop: 8,
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = c.accent}
              onMouseOut={(e) => e.currentTarget.style.borderColor = c.border}
            >
              <div style={{ 
                width: 20, 
                height: 20, 
                borderRadius: "50%", 
                border: `2px solid ${c.textMuted}`, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: 12
              }}>+</div>
              <span>Add Channel</span>
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: c.textDim, textTransform: "uppercase", marginBottom: 8 }}>Views</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <button onClick={() => setCurrentView(1)} style={{ padding: "4px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, background: currentView === 1 ? c.accent : c.bgHover, color: currentView === 1 ? "#fff" : c.textMuted }}>Table</button>
              <button onClick={() => setCurrentView(2)} style={{ padding: "4px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, background: currentView === 2 ? c.accent : c.bgHover, color: currentView === 2 ? "#fff" : c.textMuted }}>Grid</button>
              <button onClick={() => setCurrentView(3)} style={{ padding: "4px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, background: currentView === 3 ? c.accent : c.bgHover, color: currentView === 3 ? "#fff" : c.textMuted }}>Bars</button>
              <button onClick={() => setCurrentView(4)} style={{ padding: "4px 6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, background: currentView === 4 ? c.accent : c.bgHover, color: currentView === 4 ? "#fff" : c.textMuted }}>List</button>
            </div>
          </div>
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

          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {/* Grid Mode: 6 videos per row with visible metrics */}
            {viewMode === "grid" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
                {filteredVideos.map(v => (
                  <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 8, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", border: `1px solid ${c.border}`, aspectRatio: "1" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                    <div style={{ position: "relative", width: "100%", height: "60%" }}>
                      <img src={v.coverUrl || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", background: c.bgHover }} />
                      <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.8)", color: "white", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                        {fmt(v.stats.playCount)}
                      </div>
                    </div>
                    <div style={{ padding: 8, height: "40%" }}>
                      <div style={{ fontSize: 9, color: c.textMuted, marginBottom: 4 }}>@{v.author}</div>
                      <div style={{ fontSize: 10, color: c.text, lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.desc || "—"}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 9 }}>
                        <span style={{ color: c.red }}>❤️ {fmt(v.stats.diggCount)}</span>
                        <span style={{ color: c.green }}>💬 {fmt(v.stats.commentCount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List Mode: Current view system */}
            {viewMode === "list" && (
              <>
                {/* View 1: Data Table */}
                {currentView === 1 && (
              <div style={{ background: c.bgAlt, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "300px 100px 100px 100px 100px 120px", gap: 0, fontSize: 11, fontWeight: 600, background: c.bg, padding: "12px 16px", borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ color: c.textMuted }}>VIDEO</div>
                  <div style={{ color: c.textMuted, textAlign: "center" }}>VIEWS</div>
                  <div style={{ color: c.textMuted, textAlign: "center" }}>LIKES</div>
                  <div style={{ color: c.textMuted, textAlign: "center" }}>COMMENTS</div>
                  <div style={{ color: c.textMuted, textAlign: "center" }}>SHARES</div>
                  <div style={{ color: c.textMuted, textAlign: "center" }}>AUTHOR</div>
                </div>
                {filteredVideos.map(v => (
                  <div key={v.id} onClick={() => setSelected(v)} style={{ display: "grid", gridTemplateColumns: "300px 100px 100px 100px 100px 120px", gap: 0, padding: "12px 16px", borderBottom: `1px solid ${c.border}`, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = c.bgHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={v.coverUrl || ""} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover", background: c.bgHover }} />
                      <div style={{ fontSize: 12, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.desc || "—"}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.accent, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{fmt(v.stats.playCount)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.red, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{fmt(v.stats.diggCount)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.green, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{fmt(v.stats.commentCount)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.yellow, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{fmt(v.stats.shareCount)}</div>
                    <div style={{ fontSize: 11, color: c.textMuted, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>@{v.author}</div>
                  </div>
                ))}
              </div>
            )}

            {/* View 2: Card Grid with Metrics */}
            {currentView === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filteredVideos.map(v => (
                  <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 8, padding: 16, cursor: "pointer", transition: "all 0.2s", border: `1px solid ${c.border}` }} onMouseEnter={e => { e.currentTarget.style.background = c.bgHover; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.background = c.bgAlt; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <img src={v.coverUrl || ""} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", background: c.bgHover }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 4 }}>@{v.author}</div>
                        <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.desc || "—"}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: c.bg, padding: 8, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.accent }}>{fmt(v.stats.playCount)}</div>
                        <div style={{ fontSize: 9, color: c.textMuted }}>Views</div>
                      </div>
                      <div style={{ background: c.bg, padding: 8, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.red }}>{fmt(v.stats.diggCount)}</div>
                        <div style={{ fontSize: 9, color: c.textMuted }}>Likes</div>
                      </div>
                      <div style={{ background: c.bg, padding: 8, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.green }}>{fmt(v.stats.commentCount)}</div>
                        <div style={{ fontSize: 9, color: c.textMuted }}>Comments</div>
                      </div>
                      <div style={{ background: c.bg, padding: 8, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.yellow }}>{fmt(v.stats.shareCount)}</div>
                        <div style={{ fontSize: 9, color: c.textMuted }}>Shares</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View 3: Analytics Bars */}
            {currentView === 3 && (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredVideos.map(v => {
                  const maxViews = Math.max(...filteredVideos.map(x => x.stats.playCount));
                  const viewPercent = (v.stats.playCount / maxViews) * 100;
                  const likePercent = (v.stats.diggCount / maxViews) * 100;
                  const commentPercent = (v.stats.commentCount / maxViews) * 100;
                  const sharePercent = (v.stats.shareCount / maxViews) * 100;
                  
                  return (
                    <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 8, padding: 16, cursor: "pointer", transition: "all 0.2s", border: `1px solid ${c.border}` }} onMouseEnter={e => e.currentTarget.style.background = c.bgHover} onMouseLeave={e => e.currentTarget.style.background = c.bgAlt}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <img src={v.coverUrl || ""} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", background: c.bgHover }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 2 }}>@{v.author}</div>
                          <div style={{ fontSize: 11, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.desc || "—"}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: c.textMuted, marginBottom: 2 }}>
                            <span>Views</span>
                            <span>{fmt(v.stats.playCount)}</span>
                          </div>
                          <div style={{ height: 6, background: c.bgHover, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: c.accent, borderRadius: 3, width: `${viewPercent}%`, transition: "width 0.5s ease" }}></div>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: c.textMuted, marginBottom: 2 }}>
                              <span>Likes</span>
                              <span>{fmt(v.stats.diggCount)}</span>
                            </div>
                            <div style={{ height: 4, background: c.bgHover, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", background: c.red, borderRadius: 2, width: `${likePercent}%`, transition: "width 0.5s ease" }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: c.textMuted, marginBottom: 2 }}>
                              <span>Comments</span>
                              <span>{fmt(v.stats.commentCount)}</span>
                            </div>
                            <div style={{ height: 4, background: c.bgHover, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", background: c.green, borderRadius: 2, width: `${commentPercent}%`, transition: "width 0.5s ease" }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: c.textMuted, marginBottom: 2 }}>
                              <span>Shares</span>
                              <span>{fmt(v.stats.shareCount)}</span>
                            </div>
                            <div style={{ height: 4, background: c.bgHover, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", background: c.yellow, borderRadius: 2, width: `${sharePercent}%`, transition: "width 0.5s ease" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View 4: Compact List */}
            {currentView === 4 && (
              <div style={{ display: "grid", gap: 8 }}>
                {filteredVideos.map(v => (
                  <div key={v.id} onClick={() => setSelected(v)} style={{ background: c.bgAlt, borderRadius: 6, padding: 12, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${c.border}` }} onMouseEnter={e => e.currentTarget.style.background = c.bgHover} onMouseLeave={e => e.currentTarget.style.background = c.bgAlt}>
                    <img src={v.coverUrl || ""} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover", background: c.bgHover }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 2 }}>@{v.author}</div>
                      <div style={{ fontSize: 10, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.desc || "—"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, fontWeight: 600 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: c.accent }}>{fmt(v.stats.playCount)}</div>
                        <div style={{ fontSize: 8, color: c.textMuted }}>Views</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: c.red }}>{fmt(v.stats.diggCount)}</div>
                        <div style={{ fontSize: 8, color: c.textMuted }}>Likes</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: c.green }}>{fmt(v.stats.commentCount)}</div>
                        <div style={{ fontSize: 8, color: c.textMuted }}>Comments</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: c.yellow }}>{fmt(v.stats.shareCount)}</div>
                        <div style={{ fontSize: 8, color: c.textMuted }}>Shares</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
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

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: c.bg, borderRadius: 16, padding: 32, maxWidth: 500, width: "100%", border: `1px solid ${c.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", color: c.textMuted, cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 8 }}>APIFY API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your APIFY API key"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${c.border}`, background: c.bgAlt, color: c.text, fontSize: 14 }}
              />
              <p style={{ fontSize: 11, color: c.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                Get your API key from <a href="https://apify.com/account/settings" target="_blank" rel="noopener noreferrer" style={{ color: c.accent }}>Apify Dashboard</a>. This key is used to fetch fresh TikTok data.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.textMuted, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (apiKey.trim()) {
                    localStorage.setItem('apify_api_key', apiKey.trim());
                    console.log('API key saved to localStorage');
                    alert('APIFY API key saved successfully! It will be remembered for all future sessions.');
                  } else {
                    alert('Please enter a valid API key.');
                  }
                  setShowSettings(false);
                }}
                style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: c.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: c.bg, borderRadius: 16, padding: 32, maxWidth: 500, width: "100%", border: `1px solid ${c.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>Add New Channels</h2>
              <button onClick={() => { setShowAddChannel(false); setNewChannels(""); }} style={{ background: "none", border: "none", color: c.textMuted, cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 8 }}>TikTok Channel Names</label>
              <textarea
                value={newChannels}
                onChange={(e) => setNewChannels(e.target.value)}
                placeholder="Enter channel names (one per line or comma-separated)&#10;&#10;Examples:&#10;@username1&#10;@username2, @username3&#10;username4"
                style={{ 
                  width: "100%", 
                  height: 120, 
                  padding: "10px 12px", 
                  borderRadius: 8, 
                  border: `1px solid ${c.border}`, 
                  background: c.bgAlt, 
                  color: c.text, 
                  fontSize: 14, 
                  fontFamily: "inherit",
                  resize: "vertical",
                  lineHeight: 1.5
                }}
              />
              <p style={{ fontSize: 11, color: c.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                Enter TikTok usernames with or without the @ symbol. You can add multiple channels by separating them with commas or putting each on a new line.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowAddChannel(false); setNewChannels(""); }}
                style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.textMuted, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newChannels.trim()) {
                    const channels = newChannels
                      .split(/[,\n]/)
                      .map(ch => ch.trim().replace(/^@/, ''))
                      .filter(ch => ch.length > 0);
                    
                    if (channels.length > 0) {
                      try {
                        const apiKey = localStorage.getItem('apify_api_key') || '';
                        if (!apiKey) {
                          alert('Please set your APIFY API key in Settings first.');
                          setShowAddChannel(false);
                          setShowSettings(true);
                          return;
                        }

                        const response = await fetch('/api/add-channels', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ channels, apiKey })
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                          alert(`Successfully added ${channels.length} channel(s)! Refreshing data to show new channels.`);
                          setNewChannels("");
                          setShowAddChannel(false);
                          // Trigger data refresh to show new channels
                          await onRefresh();
                        } else {
                          alert(`Failed to add channels: ${result.error}`);
                        }
                      } catch (error) {
                        console.error('Add channels error:', error);
                        alert('Failed to add channels. Please try again.');
                      }
                    }
                  }
                }}
                disabled={!newChannels.trim()}
                style={{ 
                  padding: "10px 20px", 
                  borderRadius: 8, 
                  border: "none", 
                  background: newChannels.trim() ? c.accent : c.border, 
                  color: newChannels.trim() ? "#fff" : c.textMuted, 
                  cursor: newChannels.trim() ? "pointer" : "not-allowed", 
                  fontSize: 14, 
                  fontWeight: 500 
                }}
              >
                Add Channels
              </button>
            </div>
          </div>
        </div>
      )}
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
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export default function Page() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Use new API endpoint that handles both database and file fallback
    fetch("/api/data")
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
          console.log('Data loaded from:', result.source);
        } else {
          console.error('Failed to load data:', result.error);
        }
      })
      .finally(() => setLoading(false));
    
    // Load saved API key immediately
    const savedApiKey = localStorage.getItem('apify_api_key');
    if (savedApiKey && savedApiKey.trim()) {
      setApiKey(savedApiKey.trim());
      console.log('Loaded saved API key');
    }

    // Load TikTok embed script
    const scriptId = 'tiktok-embed-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = () => {
        // Trigger render multiple times to ensure embeds load
        const attemptRender = () => {
          if (window.tiktokEmbed && window.tiktokEmbed.lib && typeof window.tiktokEmbed.lib.render === 'function') {
            window.tiktokEmbed.lib.render();
          } else if (window.tiktokEmbed && typeof window.tiktokEmbed.load === 'function') {
            window.tiktokEmbed.load();
          }
        };
        setTimeout(attemptRender, 100);
        setTimeout(attemptRender, 500);
        setTimeout(attemptRender, 1500);
        setTimeout(attemptRender, 3000);
      };
      document.body.appendChild(script);
    }
  }, []);

  // Trigger TikTok embed rendering when data changes
  useEffect(() => {
    if (data && mounted) {
      const attemptRender = () => {
        if (window.tiktokEmbed && window.tiktokEmbed.lib && typeof window.tiktokEmbed.lib.render === 'function') {
          window.tiktokEmbed.lib.render();
        } else if (window.tiktokEmbed && typeof window.tiktokEmbed.load === 'function') {
          window.tiktokEmbed.load();
        }
      };
      
      // Multiple attempts to ensure embeds load
      setTimeout(attemptRender, 100);
      setTimeout(attemptRender, 500);
      setTimeout(attemptRender, 1500);
      setTimeout(attemptRender, 3000);
    }
  }, [data, mounted]);

  const handleRefresh = async () => {
    const savedApiKey = localStorage.getItem('apify_api_key');
    if (!savedApiKey) {
      alert('Please set your APIFY API key in Settings first.');
      setShowSettings(true);
      return;
    }

    setRefreshing(true);
    try {
      const res = await fetch("/api/refresh", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: savedApiKey })
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        // Only update if we got actual data
        const videoCount = result.data.all_videos?.length || 0;
        if (videoCount > 0) {
          setData(result.data);
          alert(`Successfully refreshed ${videoCount} videos!`);
        } else {
          alert('Refresh completed but no new videos found. Check your profiles and API key.');
        }
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

  if (loading || !mounted) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff" }}>🚀 ScopeDash is Loading Successfully!</div>;
  if (!data) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff" }}>Error loading data</div>;

  const viewProps: ViewProps = { data, profiles, videos, topIds, metrics, onRefresh: handleRefresh, refreshing, showSettings, setShowSettings, apiKey, setApiKey };

  return <Dashboard {...viewProps} />;
}