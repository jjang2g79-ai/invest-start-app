const getAccessToken = async (appKey, appSecret) => {
  const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  })
  if (!res.ok) throw new Error('토큰 발급 실패')
  const data = await res.json()
  return data.access_token
}

const getTopVolume = async (token, appKey, appSecret) => {
  const res = await fetch(
    'https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/ranking/volume',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': 'FHPST01710000',
        'custtype': 'P',
      },
    }
  )
  if (!res.ok) throw new Error('거래량 조회 실패')
  const data = await res.json()
  return data.output || []
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const appKey    = process.env.KIS_APP_KEY
  const appSecret = process.env.KIS_APP_SECRET

  if (!appKey || !appSecret) {
    return res.status(200).json({ stocks: getDefaultStocks() })
  }

  try {
    const token = await getAccessToken(appKey, appSecret)
    const items = await getTopVolume(token, appKey, appSecret)

    const stocks = items
      .slice(0, 30)
      .map((item) => {
        const name = item.hts_kor_isnm || ''
        const code = item.mksc_shrn_iscd || ''

        const isETF = ['ETF','KODEX','TIGER','KINDEX','HANARO','ARIRANG']
          .some(k => name.includes(k))
        const isExcluded = ['레버리지','인버스','곱버스','2X','선물']
          .some(k => name.includes(k))

        if (isExcluded || !code) return null

        return {
          code,
          name,
          type: isETF ? 'ETF' : '대형주',
          volatility: isETF ? '낮음' : '보통',
          marketCap: '대형',
          suggestedRatio: isETF ? 0.15 : 0.1,
          volume: Number(item.acml_vol || 0),
        }
      })
      .filter(Boolean)
      .slice(0, 20)

    return res.status(200).json({ stocks })

  } catch (error) {
    console.error('KIS API 오류:', error.message)
    return res.status(200).json({ stocks: getDefaultStocks() })
  }
}

const getDefaultStocks = () => [
  { code:'069500', name:'KODEX 200',          type:'ETF',    volatility:'낮음', marketCap:'대형', suggestedRatio:0.2  },
  { code:'360750', name:'TIGER 미국S&P500',   type:'ETF',    volatility:'낮음', marketCap:'대형', suggestedRatio:0.2  },
  { code:'379800', name:'KODEX 미국S&P500TR', type:'ETF',    volatility:'낮음', marketCap:'대형', suggestedRatio:0.15 },
  { code:'005930', name:'삼성전자',            type:'대형주', volatility:'보통', marketCap:'대형', suggestedRatio:0.1  },
  { code:'000660', name:'SK하이닉스',          type:'대형주', volatility:'보통', marketCap:'대형', suggestedRatio:0.05 },
  { code:'091160', name:'KODEX 반도체',        type:'ETF',    volatility:'보통', marketCap:'대형', suggestedRatio:0.1  },
  { code:'305720', name:'TIGER 2차전지테마',   type:'ETF',    volatility:'높음', marketCap:'대형', suggestedRatio:0.05 },
  { code:'102110', name:'TIGER 200',           type:'ETF',    volatility:'낮음', marketCap:'대형', suggestedRatio:0.1  },
  { code:'133690', name:'TIGER 미국나스닥100', type:'ETF',    volatility:'보통', marketCap:'대형', suggestedRatio:0.1  },
  { code:'005490', name:'POSCO홀딩스',         type:'대형주', volatility:'보통', marketCap:'대형', suggestedRatio:0.05 },
]
