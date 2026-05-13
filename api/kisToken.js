const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const KIS_BASE = 'https://openapi.koreainvestment.com:9443'

const getTokenFromDB = async () => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/kis_tokens?select=access_token,expired_at&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.length === 0) return null

    const token = data[0]
    const now = new Date()
    const expiredAt = new Date(token.expired_at)

    // 만료 30분 전까지 재사용
    if (expiredAt > new Date(now.getTime() + 30 * 60 * 1000)) {
      console.log('DB 토큰 재사용. 만료:', expiredAt.toLocaleString('ko-KR'))
      return token.access_token
    }

    return null
  } catch (err) {
    console.log('DB 토큰 조회 실패:', err.message)
    return null
  }
}

const saveTokenToDB = async (accessToken, expiredAt) => {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/kis_tokens`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    await fetch(
      `${SUPABASE_URL}/rest/v1/kis_tokens`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          expired_at: expiredAt,
        }),
      }
    )
    console.log('토큰 DB 저장 완료')
  } catch (err) {
    console.log('토큰 DB 저장 실패:', err.message)
  }
}

const issueNewToken = async (appKey, appSecret) => {
  const res = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error('토큰 발급 실패')
  const data = await res.json()
  return {
    accessToken: data.access_token,
    expiredAt: data.access_token_token_expired,
  }
}

export const getKisToken = async (appKey, appSecret) => {
  // 1. DB에서 유효한 토큰 조회
  if (SUPABASE_URL && SUPABASE_KEY) {
    const cachedToken = await getTokenFromDB()
    if (cachedToken) return cachedToken
  }

  // 2. 새 토큰 발급
  console.log('새 토큰 발급 중...')
  const { accessToken, expiredAt } = await issueNewToken(appKey, appSecret)

  // 3. DB에 저장
  if (SUPABASE_URL && SUPABASE_KEY) {
    await saveTokenToDB(accessToken, expiredAt)
  }

  return accessToken
}
