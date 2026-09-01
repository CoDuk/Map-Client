export interface VisitorSummary {
  startDate: string
  endDate: string
  activeUsers: number
  newUsers: number
  sessions: number
  screenPageViews: number
}

export interface RealtimeVisitors {
  activeUsers: number
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function getVisitorSummary(
  startDate = '28daysAgo',
  endDate = 'today',
): Promise<VisitorSummary> {
  const params = new URLSearchParams({ startDate, endDate })
  return fetchJson<VisitorSummary>(`/api/analytics/visitors?${params}`)
}

export function getRealtimeVisitors(): Promise<RealtimeVisitors> {
  return fetchJson<RealtimeVisitors>('/api/analytics/visitors?realtime=1')
}
