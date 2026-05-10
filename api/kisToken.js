const KIS_BASE = 'https://openapi.koreainvestment.com:9443'

export const getKisToken = async (appKey, appSecret) => {
  try {
    // STEP 1: 기존 토큰 조회 시도
    const checkRes = await fetch(`${KIS_BASE}/oauth2/checkAuthorization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (checkRes.ok) {
      const checkData = await checkRes.json()
      if (checkData.access_token) {
        console.log('기존 토큰 재사용. 만료:', checkData.access_token_token_expired)
        return checkData.access_token
      }
    }
  } catch {
    console.log('토큰 조회 실패 → 새로 발급')
  }

  // STEP 2: 새 토큰 발급
  console.log('새 토큰 발급 중...')
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
  console.log('새 토큰 발급 완료. 만료:', data.access_token_token_expired)
  return data.access_token
}
