import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getLogs, getLogsStats } from "../api/adminApi";
import type { LogLevel, LogSource, LogsFilters, LogsPagination, LogEntry, LogsStats } from "../api/types";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useLogsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [level, setLevel] = useState<LogLevel | "">(() => (searchParams.get("level") as LogLevel) || "");
  const [source, setSource] = useState<LogSource | "">(() => (searchParams.get("source") as LogSource) || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [timeFilter, setTimeFilter] = useState<"today" | "hour" | "week" | "month">(
    () => (searchParams.get("time") as any) || "today"
  );
  const [sort, setSort] = useState<"desc" | "asc">(() => (searchParams.get("sort") as any) || "desc");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (level) params.set("level", level);
    else params.delete("level");
    if (source) params.set("source", source);
    else params.delete("source");
    if (search) params.set("search", search);
    else params.delete("search");
    if (timeFilter) params.set("time", timeFilter);
    else params.delete("time");
    if (sort) params.set("sort", sort);
    else params.delete("sort");
    setSearchParams(params, { replace: true });
  }, [level, source, search, timeFilter, sort, searchParams, setSearchParams]);

  const getFilters = useCallback((): LogsFilters => {
    const filters: LogsFilters = {
      sort,
    };

    if (level) filters.level = level;
    if (source) filters.source = source;
    if (search) filters.search = search;

    // Convert time filter to date range
    const now = new Date();
    let dateFrom: Date | null = null;

    switch (timeFilter) {
      case "hour":
        dateFrom = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "today":
        dateFrom = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    if (dateFrom) {
      filters.date_from = dateFrom.toISOString();
    }

    return filters;
  }, [level, source, search, timeFilter, sort]);

  const resetFilters = useCallback(() => {
    setLevel("");
    setSource("");
    setSearch("");
    setTimeFilter("today");
    setSort("desc");
  }, []);

  return {
    level,
    setLevel,
    source,
    setSource,
    search,
    setSearch,
    timeFilter,
    setTimeFilter,
    sort,
    setSort,
    getFilters,
    resetFilters,
  };
}

export function useLogsPagination(initialLimit: number = 10) {
  const [limit, setLimit] = useState(initialLimit);
  const [page, setPage] = useState(1);

  const offset = (page - 1) * limit;

  const getPagination = useCallback((): LogsPagination => {
    return { limit, offset };
  }, [limit, offset]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  return {
    limit,
    setLimit,
    page,
    setPage,
    offset,
    getPagination,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
  };
}

export function useLogsData(filters?: LogsFilters, pagination?: LogsPagination) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters and pagination to prevent infinite re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters?.level,
    filters?.source,
    filters?.search,
    filters?.date_from,
    filters?.date_to,
    filters?.sort,
  ]);
  const memoizedPagination = useMemo(() => pagination, [pagination?.limit, pagination?.offset]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLogs(memoizedFilters, memoizedPagination);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, memoizedPagination]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, total, loading, error, refetch: fetchLogs };
}

export function useLogsStats() {
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLogsStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
