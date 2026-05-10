import { getKisToken } from './kisToken.js'

const KIS_BASE = 'https://openapi.koreainvestment.com:9443'

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

const getTopStocks = async (token, appKey, appSecret) => {
  try {
    const res = await fetch(
      `${KIS_BASE}/uapi/domestic-stock/v1/ranking/volume`,
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
    if (!res.ok) return getDefaultStocks()
    const data = await res.json()
    const items = data.output || []

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
        }
      })
      .filter(Boolean)
      .slice(0, 20)

    return stocks.length >= 3 ? stocks : getDefaultStocks()
  } catch {
    return getDefaultStocks()
  }
}

const getStockDetail = async (code, token, appKey, appSecret) => {
  try {
    const res = await fetch(
      `${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${code}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
          'appkey': appKey,
          'appsecret': appSecret,
          'tr_id': 'FHKST01010100',
          'custtype': 'P',
        },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const output = data.output || {}
    return {
      currentPrice: Number(output.stck_prpr || 0).toLocaleString('ko-KR'),
      changeRate: output.prdy_ctrt || '0',
      changeSign: output.prdy_vrss_sign || '3',
      volume: Number(output.acml_vol || 0).toLocaleString('ko-KR'),
      high52: Number(output.w52_hgpr || 0).toLocaleString('ko-KR'),
      low52: Number(output.w52_lwpr || 0).toLocaleString('ko-KR'),
    }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const appKey      = process.env.KIS_APP_KEY
  const appSecret   = process.env.KIS_APP_SECRET
  const naverCid    = process.env.NAVER_CLIENT_ID
  const naverSecret = process.env.NAVER_CLIENT_SECRET

  if (!appKey || !appSecret) {
    return res.status(200).json({ source: 'mock', stocks: getMockData() })
  }

  try {
    const token = await getKisToken(appKey, appSecret)
    const topStocks = await getTopStocks(token, appKey, appSecret)

    const results = await Promise.all(
      topStocks.map(async (stock) => {
        const [detail, articles] = await Promise.all([
          getStockDetail(stock.code, token, appKey, appSecret),
          naverCid && naverSecret
            ? searchNaver(stock.name, naverCid, naverSecret)
            : Promise.resolve([]),
        ])

        const changeRate = Math.abs(parseFloat(detail?.changeRate || 0))
        const volatility = changeRate >= 3 ? '높음' : changeRate >= 1.5 ? '보통' : '낮음'

        return {
          ...stock,
          volatility,
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
          summary: `${stock.name} — 거래량 상위 종목`,
          sources: [`네이버 뉴스 ${articles.length}건`],
          articles: articles.slice(0, 3),
          marketData: detail ? {
            currentPrice: detail.currentPrice,
            changeRate: detail.changeRate,
            changeSign: detail.changeSign,
            volume: detail.volume,
            high52: detail.high52,
            low52: detail.low52,
          } : null,
        }
      })
    )

    results.sort((a, b) => b.mentionCount - a.mentionCount)

    return res.status(200).json({ source: 'kis', stocks: results })

  } catch (error) {
    console.error('데이터 수집 오류:', error.message)
    return res.status(200).json({ source: 'mock', stocks: getMockData() })
  }
}

const getMockData = () => [
  { code:'069500', name:'KODEX 200',        type:'ETF',    volatility:'낮음', marketCap:'대형', trustScore:85, trustLevel:'높음', trustReason:'ETF 구조', policySignal:{strength:'강함',industry:'국내 증시',description:'정부 정책',warning:'수익 보장 아님'}, summary:'국내 200개 대형주 ETF', sources:['기본 데이터'], articles:[], marketData:null, suggestedRatio:0.2,  mentionCount:0 },
  { code:'360750', name:'TIGER 미국S&P500', type:'ETF',    volatility:'낮음', marketCap:'대형', trustScore:88, trustLevel:'높음', trustReason:'미국 지수 추종', policySignal:{strength:'보통',industry:'해외 지수',description:'연준 동향',warning:'환율 리스크'}, summary:'미국 S&P500 ETF', sources:['기본 데이터'], articles:[], marketData:null, suggestedRatio:0.2,  mentionCount:0 },
  { code:'005930', name:'삼성전자',          type:'대형주', volatility:'보통', marketCap:'대형', trustScore:62, trustLevel:'중립', trustReason:'과장 표현 주의', policySignal:{strength:'강함',industry:'반도체',description:'K-반도체 정책',warning:'단기 수익 보장 아님'}, summary:'국내 대표 반도체', sources:['기본 데이터'], articles:[], marketData:null, suggestedRatio:0.1,  mentionCount:0 },
]

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
