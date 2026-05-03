import { Search, Download, GitCommit, GitPullRequest, GitBranch, Plus, Trash2, GitMerge, ArrowUpCircle, Wifi } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import { getTodayStats, getHotRepos, getTopUsers, getHourlyActivity, getRecentActivity } from "../api/adminApi";
import type { TodayStats, HotRepoStat, TopUserStat, HourlyActivity, ActivityItem } from "../api/types";

interface ActivityPageProps {
  isDarkTheme?: boolean;
}

// Цвета в зависимости от темы
const getColors = (isDark: boolean) => ({
  pageBg: isDark ? "#111111" : "#f5f5f5",
  cardBg: isDark ? "#1e1e1e" : "#ffffff",
  cardBg2: isDark ? "#161616" : "#f0f0f0",
  border: isDark ? "#30363d" : "#e0e0e0",
  accent: "#2563eb",
  accent2: "#3b82f6",
  danger: "#e24b4a",
  success: "#4caf50",
  warning: "#f59e0b",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  violet: "#7c3aed",
  textPrimary: isDark ? "#e6e6e6" : "#1a1a1a",
  textSecondary: isDark ? "#888888" : "#666666",
  textMuted: isDark ? "#444444" : "#999999",
});

// Иконки событий
const EventIcons = {
  commit: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="3"/><path d="M1 8h4M11 8h4" strokeLinecap="round"/></svg>,
  pr: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><path d="M4 6v2a4 4 0 004 4h2M14 8l-2-2 2-2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pull_request: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><path d="M4 6v2a4 4 0 004 4h2M14 8l-2-2 2-2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  push: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  create: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="1" width="12" height="14" rx="2"/><path d="M8 5v6M5 8h6" strokeLinecap="round"/></svg>,
  repo_created: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="1" width="12" height="14" rx="2"/><path d="M8 5v6M5 8h6" strokeLinecap="round"/></svg>,
  fork: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="8" cy="13" r="2"/><path d="M4 6v1a4 4 0 008 0V6M8 11V9" strokeLinecap="round"/></svg>,
  merge: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="4" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="12" cy="8" r="2"/><path d="M4 6v5M4 6c0 3 8 2 8 2" strokeLinecap="round"/></svg>,
  pr_merge: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="4" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="12" cy="8" r="2"/><path d="M4 6v5M4 6c0 3 8 2 8 2" strokeLinecap="round"/></svg>,
  delete: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  repo_deleted: <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

export default function ActivityPage({ isDarkTheme = true }: ActivityPageProps) {
  const colors = getColors(isDarkTheme);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [hotRepos, setHotRepos] = useState<HotRepoStat[]>([]);
  const [topUsers, setTopUsers] = useState<TopUserStat[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [pageOffset, setPageOffset] = useState(0);
  const [realtimeEvents, setRealtimeEvents] = useState<Array<{id: number, type: string, message: string, time: Date}>>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const eventIdRef = useRef(0);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      const [statsData, reposData, usersData, hourlyData, activityData] = await Promise.all([
        getTodayStats(),
        getHotRepos(),
        getTopUsers(),
        getHourlyActivity(),
        getRecentActivity(pageSize, pageOffset),
      ]);
      setStats(statsData);
      setHotRepos(reposData);
      setTopUsers(usersData);
      setHourlyActivity(hourlyData);
      setActivities(activityData.activities);
      setTotalActivities(activityData.total);
    } catch (error) {
      console.error("Failed to load activity data:", error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, pageOffset])

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/activity`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data);
      
      if (data.type === "new_activity") {
        // Add to realtime events
        setRealtimeEvents(prev => [{
          id: ++eventIdRef.current,
          type: data.activity_type,
          message: `${data.user_name} ${data.activity_type} to ${data.repo_name}: ${data.message}`,
          time: new Date()
        }, ...prev].slice(0, 5)); // Keep last 5
        
        // Refresh stats after short delay
        setTimeout(() => loadData(), 500);
      } else if (data.type === "stats_updated") {
        setTimeout(() => loadData(), 500);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [loadData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const getEventIconBg = (type: string) => {
    switch (type) {
      case "commit": return { bg: `${colors.accent}20`, color: colors.accent2 };
      case "pr":
      case "pull_request": return { bg: `${colors.teal}20`, color: colors.teal };
      case "push": return { bg: `${colors.success}20`, color: colors.success };
      case "create":
      case "repo_created": return { bg: `${colors.purple}20`, color: colors.purple };
      case "fork": return { bg: `${colors.warning}20`, color: colors.warning };
      case "merge":
      case "pr_merge": return { bg: `${colors.violet}20`, color: colors.violet };
      case "delete":
      case "repo_deleted": return { bg: `${colors.danger}20`, color: colors.danger };
      default: return { bg: `${colors.accent}20`, color: colors.accent2 };
    }
  };

  const getTagStyle = (type: string) => {
    switch (type) {
      case "Коммит": return { background: `${colors.accent2}10`, color: colors.accent2 };
      case "Pull Request": return { background: `${colors.teal}10`, color: colors.teal };
      case "Push": return { background: `${colors.success}10`, color: colors.success };
      case "Создание": return { background: `${colors.purple}10`, color: colors.purple };
      case "Форк": return { background: `${colors.warning}10`, color: colors.warning };
      case "Merge": return { background: `${colors.violet}10`, color: colors.violet };
      case "Удаление": return { background: `${colors.danger}10`, color: colors.danger };
      default: return { background: `${colors.accent2}10`, color: colors.accent2 };
    }
  };

  return (
    <div style={{ backgroundColor: colors.pageBg, minHeight: "100vh", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 600, color: colors.textPrimary }}>Активность</div>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "3px" }}>Лента всех событий платформы в реальном времени</div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 500,
          padding: "7px 14px", borderRadius: "7px", border: `0.5px solid ${colors.border}`,
          background: colors.cardBg, color: colors.textPrimary, cursor: "pointer"
        }}>
          <Download size={14} /> Экспорт
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {loading ? (
          <div style={{ gridColumn: "span 4", textAlign: "center", color: colors.textSecondary }}>Загрузка...</div>
        ) : stats ? (
          <>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px" }}>Событий сегодня</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color: colors.textPrimary }}>{stats.total_events}</div>
              <div style={{ fontSize: "11px", marginTop: "3px", color: colors.success }}>↑ +{stats.total_events_delta} к вчера</div>
            </div>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px" }}>Коммитов</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color: colors.textPrimary }}>{stats.commits}</div>
              <div style={{ fontSize: "11px", marginTop: "3px", color: colors.success }}>↑ +{stats.commits_delta}</div>
            </div>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px" }}>Активных пользователей</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color: colors.textPrimary }}>{stats.active_users}</div>
              <div style={{ fontSize: "11px", marginTop: "3px", color: colors.success }}>↑ +{stats.active_users_delta}</div>
            </div>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px" }}>Новых репозиториев</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color: colors.textPrimary }}>{stats.new_repositories}</div>
              <div style={{ fontSize: "11px", marginTop: "3px", color: colors.textSecondary }}>За сегодня</div>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: "span 4", textAlign: "center", color: colors.textSecondary }}>Ошибка загрузки</div>
        )}
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
        {/* Left - Feed */}
        <div>
          {/* Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", background: colors.cardBg,
            border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px", marginBottom: "10px"
          }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: "6px", background: colors.pageBg,
              border: `0.5px solid ${colors.border}`, borderRadius: "7px", padding: "5px 10px"
            }}>
              <Search size={13} color={colors.textMuted} />
              <input type="text" placeholder="Поиск по событиям, пользователям, репо..." style={{
                background: "transparent", border: "none", outline: "none", fontSize: "12px",
                color: colors.textPrimary, width: "100%", fontFamily: "inherit"
              }} />
            </div>
            <div style={{ width: "0.5px", height: "20px", background: colors.border }} />
            {/* WebSocket Status */}
            <div style={{
              display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px",
              background: wsConnected ? `${colors.success}20` : `${colors.danger}20`,
              borderRadius: "6px", fontSize: "11px", color: wsConnected ? colors.success : colors.danger
            }}>
              <Wifi size={12} />
              {wsConnected ? "Online" : "Offline"}
            </div>
            <div style={{ width: "0.5px", height: "20px", background: colors.border }} />
            <select style={{
              fontSize: "11px", padding: "5px 8px", borderRadius: "7px", border: `0.5px solid ${colors.border}`,
              background: colors.pageBg, color: colors.textPrimary, cursor: "pointer", fontFamily: "inherit"
            }}>
              <option>Все события</option>
              <option>Коммиты</option>
              <option>Пуши</option>
              <option>Форки</option>
              <option>Pull Request</option>
            </select>
            <select style={{
              fontSize: "11px", padding: "5px 8px", borderRadius: "7px", border: `0.5px solid ${colors.border}`,
              background: colors.pageBg, color: colors.textPrimary, cursor: "pointer", fontFamily: "inherit"
            }}>
              <option>Все пользователи</option>
            </select>
            <select style={{
              fontSize: "11px", padding: "5px 8px", borderRadius: "7px", border: `0.5px solid ${colors.border}`,
              background: colors.pageBg, color: colors.textPrimary, cursor: "pointer", fontFamily: "inherit"
            }}>
              <option>Сегодня</option>
              <option>Вчера</option>
              <option>За неделю</option>
            </select>
          </div>

          {/* Feed */}
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{
              padding: "8px 16px", background: colors.cardBg2, borderBottom: `0.5px solid ${colors.border}`,
              fontSize: "11px", fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em"
            }}>
              Сегодня — {new Date().toLocaleDateString("ru-RU")}
            </div>

            {activities.map((activity: ActivityItem) => {
              const iconBg = getEventIconBg(activity.type);
              const tagStyle = getTagStyle(activity.tag);
              return (
                <div key={activity.id} style={{
                  display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 16px",
                  borderBottom: `0.5px solid ${colors.border}`, cursor: "pointer"
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px", background: iconBg.bg, color: iconBg.color
                  }}>
                    {EventIcons[activity.type as keyof typeof EventIcons]}
                  </div>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "8px", fontWeight: 700, flexShrink: 0, marginTop: "1px", background: `${activity.color}20`, color: activity.color
                  }}>
                    {activity.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: colors.textPrimary, lineHeight: 1.5 }}>
                      <strong style={{ fontWeight: 600 }}>{activity.user}</strong>
                      {activity.type === "commit" && " сделал коммит в "}
                      {activity.type === "pr" && " открыл Pull Request в "}
                      {activity.type === "push" && " запушил "}
                      {activity.type === "create" && " создал "}
                      {activity.type === "fork" && " форкнул "}
                      {activity.type === "merge" && " смёрджил "}
                      {activity.type === "delete" && " удалил репозиторий "}
                      <span style={{ color: colors.accent2, fontFamily: "monospace", fontSize: "11px" }}>{activity.repo}</span>
                      {activity.message && activity.type !== "push" && activity.type !== "delete" && (
                        <span style={{ color: colors.textSecondary, fontStyle: "italic", fontSize: "11px" }}> — «{activity.message}»</span>
                      )}
                      {activity.message && (activity.type === "push" || activity.type === "delete") && (
                        <span style={{ color: colors.textSecondary, fontSize: "11px" }}> {activity.message}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "5px", fontWeight: 500, ...tagStyle }}>{activity.tag}</span>
                      <span style={{ fontSize: "10px", color: colors.textMuted }}>{activity.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderTop: `0.5px solid ${colors.border}`, fontSize: "11px", color: colors.textSecondary
            }}>
              <span>Показано {activities.length} из {totalActivities}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {[10, 25, 50].map((size) => (
                  <button
                    key={size}
                    onClick={() => { setPageSize(size); setPageOffset(0); }}
                    style={{
                      width: "32px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "6px", border: `0.5px solid ${colors.border}`, fontSize: "11px", cursor: "pointer",
                      color: pageSize === size ? "#fff" : colors.textSecondary,
                      background: pageSize === size ? colors.accent : "transparent",
                      borderColor: pageSize === size ? "transparent" : colors.border
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Hour Activity */}
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px" }}>
            <div style={{
              padding: "10px 14px", borderBottom: `0.5px solid ${colors.border}`, fontSize: "11px",
              fontWeight: 600, color: colors.textPrimary, display: "flex", alignItems: "center", justifyContent: "space-between",
              background: colors.cardBg2
            }}>
              Активность по часам <span style={{ fontSize: "10px", color: colors.textSecondary, fontWeight: 400 }}>Сегодня</span>
            </div>
            <div style={{ padding: "12px 14px 6px", height: "120px", position: "relative" }}>
              {/* Tooltip */}
              {(() => {
                const [tooltip, setTooltip] = useState<{x: number, y: number, hour: number, count: number} | null>(null);
                const [hoveredHour, setHoveredHour] = useState<number | null>(null);
                const maxCount = Math.max(...hourlyActivity.map(h => h.count), 1);
                const peakHour = hourlyActivity.find(h => h.count === maxCount)?.hour;
                
                return (
                  <>
                    {/* Bars */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "90px" }}>
                      {hourlyActivity.map((item) => {
                        // Scale to 80px max (leaving 10px padding), min 4px for visibility
                        const barHeight = item.count > 0 
                          ? Math.max((item.count / maxCount) * 80, 4) 
                          : 4;
                        const isPeak = item.hour === peakHour && item.count > 0;
                        const isCurrent = item.is_current;
                        const isHovered = hoveredHour === item.hour;
                        
                        return (
                          <div key={item.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div
                              style={{
                                width: "100%",
                                background: isHovered
                                  ? "#fff"
                                  : isCurrent 
                                    ? colors.accent 
                                    : isPeak 
                                      ? `${colors.accent}80` 
                                      : `${colors.accent}30`,
                                borderRadius: "3px 3px 0 0",
                                height: `${barHeight}px`,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: isHovered 
                                  ? `0 0 12px #fff80` 
                                  : isPeak 
                                    ? `0 0 8px ${colors.accent}50` 
                                    : "none",
                              }}
                              onMouseEnter={(e) => {
                                setHoveredHour(item.hour);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const parent = e.currentTarget.parentElement?.parentElement?.parentElement;
                                if (parent) {
                                  const parentRect = parent.getBoundingClientRect();
                                  setTooltip({
                                    x: rect.left - parentRect.left + rect.width / 2,
                                    y: rect.top - parentRect.top - 35,
                                    hour: item.hour,
                                    count: item.count
                                  });
                                }
                              }}
                              onMouseLeave={() => {
                                setHoveredHour(null);
                                setTooltip(null);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Time Labels */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      marginTop: "6px",
                      padding: "0 2px"
                    }}>
                      {["00:00", "06:00", "12:00", "18:00", "23:59"].map((time) => (
                        <span key={time} style={{ fontSize: "9px", color: colors.textSecondary }}>
                          {time}
                        </span>
                      ))}
                    </div>
                    
                    {/* Tooltip */}
                    {tooltip && (
                      <div style={{
                        position: "absolute",
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: "translateX(-50%)",
                        background: "rgba(0, 0, 0, 0.85)",
                        color: "#fff",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 1000,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{ fontWeight: 600 }}>{String(tooltip.hour).padStart(2, "0")}:00</div>
                        <div style={{ opacity: 0.8 }}>{tooltip.count} событий</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Top Users */}
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{
              padding: "10px 14px", borderBottom: `0.5px solid ${colors.border}`, fontSize: "11px",
              fontWeight: 600, color: colors.textPrimary, display: "flex", alignItems: "center", justifyContent: "space-between",
              background: colors.cardBg2
            }}>
              Топ пользователей <span style={{ fontSize: "10px", color: colors.textSecondary, fontWeight: 400 }}>По коммитам</span>
            </div>
            {topUsers.map((user, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px",
                borderBottom: i < topUsers.length - 1 ? `0.5px solid ${colors.border}` : "none"
              }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 700, flexShrink: 0, background: `${user.color}20`, color: user.color
                }}>
                  {user.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: colors.textPrimary }}>{user.name}</span>
                    <span style={{ fontSize: "11px", color: colors.textSecondary }}>{user.count}</span>
                  </div>
                  <div style={{ height: "3px", background: colors.cardBg2, borderRadius: "2px", overflow: "hidden", marginTop: "3px" }}>
                    <div style={{ height: "100%", borderRadius: "2px", background: colors.accent, width: `${user.percent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hot Repos */}
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{
              padding: "10px 14px", borderBottom: `0.5px solid ${colors.border}`, fontSize: "11px",
              fontWeight: 600, color: colors.textPrimary, display: "flex", alignItems: "center", justifyContent: "space-between",
              background: colors.cardBg2
            }}>
              Горячие репо <span style={{ fontSize: "10px", color: colors.textSecondary, fontWeight: 400 }}>По событиям</span>
            </div>
            {hotRepos.map((repo, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px",
                borderBottom: i < hotRepos.length - 1 ? `0.5px solid ${colors.border}` : "none", fontSize: "12px"
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, stroke: colors.textMuted, strokeWidth: 1.2 }}>
                  <rect x="2" y="1" width="12" height="14" rx="2"/>
                  <path d="M5 5h6M5 8h6M5 11h3" strokeLinecap="round"/>
                </svg>
                <span style={{ flex: 1, color: colors.textPrimary, fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{repo.name}</span>
                <span style={{ color: colors.textSecondary, fontSize: "11px", whiteSpace: "nowrap" }}>{repo.events} событие</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
