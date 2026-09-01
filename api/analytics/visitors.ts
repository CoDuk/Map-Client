import type { VercelRequest, VercelResponse } from '@vercel/node'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

function getClient() {
  const { GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY } = process.env

  if (!GA_PROPERTY_ID || !GA_CLIENT_EMAIL || !GA_PRIVATE_KEY) {
    throw new Error(
      'Missing GA env vars: GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY must be set.',
    )
  }

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: GA_CLIENT_EMAIL,
      // Vercel env values can't contain literal newlines, so \n comes escaped.
      private_key: GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
  })

  return { client, propertyId: GA_PROPERTY_ID }
}

async function getRealtimeActiveUsers(
  client: BetaAnalyticsDataClient,
  propertyId: string,
) {
  const [response] = await client.runRealtimeReport({
    property: `properties/${propertyId}`,
    metrics: [{ name: 'activeUsers' }],
  })

  return Number(response.rows?.[0]?.metricValues?.[0]?.value ?? 0)
}

async function getVisitorSummary(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string,
) {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
    ],
  })

  const values = response.rows?.[0]?.metricValues ?? []

  return {
    startDate,
    endDate,
    activeUsers: Number(values[0]?.value ?? 0),
    newUsers: Number(values[1]?.value ?? 0),
    sessions: Number(values[2]?.value ?? 0),
    screenPageViews: Number(values[3]?.value ?? 0),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { client, propertyId } = getClient()
    const { realtime, startDate, endDate } = req.query

    if (realtime === '1' || realtime === 'true') {
      const activeUsers = await getRealtimeActiveUsers(client, propertyId)
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
      return res.status(200).json({ activeUsers })
    }

    const summary = await getVisitorSummary(
      client,
      propertyId,
      typeof startDate === 'string' ? startDate : '28daysAgo',
      typeof endDate === 'string' ? endDate : 'today',
    )
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(summary)
  } catch (error) {
    console.error('[GA analytics] failed to fetch visitor stats', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch visitor stats',
    })
  }
}
