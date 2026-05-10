let cachedToken = null
let tokenExpiredAt = null

export const getKisToken = async (appKey, appSecret) => {
  const now = Date.now()

  if (cachedToken && tokenExpiredAt && now < tokenExpiredAt) {
    console.log('토큰 캐시 사용 (만료까지', Math.round((tokenExpiredAt - now) / 1000 / 60), '분)')
    return cachedToken
  }

  console.log('토큰 새로 발급 중...')
  const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
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

  cachedToken = data.access_token
  tokenExpiredAt = now + 23 * 60 * 60 * 1000
  console.log('토큰 발급 완료. 만료:', new Date(tokenExpiredAt).toLocaleString('ko-KR'))

  return cachedToken
}
