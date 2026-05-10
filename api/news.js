const searchNaver = async (query, clientId, clientSecret) => {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encoded}&display=5&sort=date`

    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return []
    const data = await res.json()

    return (data.items || []).map((item) => ({
      title: item.title
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'"),
      link: item.originallink || item.link,
      pubDate: item.pubDate,
    }))
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const clientId     = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(200).json({ source: 'mock', stocks: getMockData() })
  }

  try {
    // STEP 1: 거래량 상위 종목 수집 (직접 함수 호출)
    const topStocks = await getTopStocks()

    // STEP 2: 종목별 뉴스 병렬 수집
    const results = await Promise.all(
      topStocks.map(async (stock) => {
        const articles = await searchNaver(stock.name, clientId, clientSecret)
        return {
          ...stock,
          mentionCount: articles.length,
          trustScore: 70,
          trustLevel: '중립',
          trustReason: 'AI 분석 버튼을 눌러 실시간 신뢰도를 확인하세요.',
          policySignal: {
            strength: '보통',
            industry: stock.type === 'ETF' ? '지수/테마' : '개별주',
            description: '정책 신호는 AI 분석에서 확인하세요.',
            warning: '정책은 참고 신호일 뿐, 수익 보장 아님',
          },
          summary: `${stock.name} — 최근 뉴스 ${articles.length}건 수집`,
          sources: [`네이버 뉴스 ${articles.length}건`],
          articles: articles.slice(0, 3),
        }
      })
    )

    results.sort((a, b) => b.mentionCount - a.mentionCount)

    return res.status(200).json({ source: 'naver', stocks: results })

  } catch (error) {
    console.error('뉴스 수집 오류:', error)
    return res.status(200).json({ source: 'mock', stocks: getMockData() })
  }
}

const getTopStocks = async () => {
  try {
    const appKey    = process.env.KIS_APP_KEY
    const appSecret = process.env.KIS_APP_SECRET

    if (!appKey || !appSecret) {
      return getDefaultStocks()
    }

    // KIS API 토큰 발급
    const tokenRes = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!tokenRes.ok) return getDefaultStocks()
    const tokenData = await tokenRes.json()
    const token = tokenData.access_token

    // 거래량 상위 종목 조회
    const rankRes = await fetch(
      'https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/ranking/volume',
      {
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
          'appkey': appKey,
          'appsecret': appSecret,
          'tr_id': 'FHPST01710000',
          'custtype': 'P',
        },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!rankRes.ok) return getDefaultStocks()
    const rankData = await rankRes.json()
    const items = rankData.output || []

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
          code, name,
          type: isETF ? 'ETF' : '대형주',
          volatility: isETF ? '낮음' : '보통',
          marketCap: '대형',
          suggestedRatio: isETF ? 0.15 : 0.1,
        }
      })
      .filter(Boolean)
      .slice(0, 20)

    if (stocks.length < 3) return getDefaultStocks()
    return stocks

  } catch (err) {
    console.log('KIS API 오류 → 기본 종목:', err.message)
    return getDefaultStocks()
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

const getMockData = () => [
  { code:'069500', name:'KODEX 200',        mentionCount:5, type:'ETF',   volatility:'낮음', marketCap:'대형', trustScore:85, trustLevel:'높음', trustReason:'ETF 구조로 과장 표현 없음.', policySignal:{strength:'강함', industry:'국내 증시 전반', description:'정부 증시 부양 정책', warning:'수익 보장 아님'}, summary:'국내 200개 대형주 ETF', sources:['네이버 뉴스 5건'], articles:[], suggestedRatio:0.4  },
  { code:'360750', name:'TIGER 미국S&P500', mentionCount:4, type:'ETF',   volatility:'낮음', marketCap:'대형', trustScore:88, trustLevel:'높음', trustReason:'미국 지수 추종 안정적.',     policySignal:{strength:'보통', industry:'해외 지수',       description:'미국 연준 동향',   warning:'환율 리스크'},         summary:'미국 S&P500 ETF',       sources:['네이버 뉴스 4건'], articles:[], suggestedRatio:0.3  },
  { code:'005930', name:'삼성전자',          mentionCount:5, type:'대형주', volatility:'보통', marketCap:'대형', trustScore:62, trustLevel:'중립', trustReason:'과장 표현 다수 포함.',     policySignal:{strength:'강함', industry:'반도체',           description:'K-반도체 정책',    warning:'단기 수익 보장 아님'}, summary:'국내 대표 반도체 기업', sources:['네이버 뉴스 5건'], articles:[], suggestedRatio:0.15 },
  { code:'091160', name:'KODEX 반도체',      mentionCount:3, type:'ETF',   volatility:'보통', marketCap:'대형', trustScore:74, trustLevel:'높음', trustReason:'ETF 구조, 정책 연계 높음.', policySignal:{strength:'강함', industry:'반도체',           description:'K-반도체 정책',    warning:'산업 집중 ETF'},       summary:'반도체 ETF',             sources:['네이버 뉴스 3건'], articles:[], suggestedRatio:0.1  },
  { code:'305720', name:'TIGER 2차전지',     mentionCount:2, type:'ETF',   volatility:'높음', marketCap:'대형', trustScore:48, trustLevel:'주의', trustReason:'과장 표현 다수.',           policySignal:{strength:'보통', industry:'2차전지',           description:'전기차 정책 연계', warning:'변동성 높음'},         summary:'2차전지 ETF. 주의 필요.', sources:['네이버 뉴스 2건'], articles:[], suggestedRatio:0.05 },
]
