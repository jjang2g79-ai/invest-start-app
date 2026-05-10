const STOCK_KEYWORDS = [
  { code: '069500', name: 'KODEX 200',        keyword: 'KODEX200 ETF',   type: 'ETF',    volatility: '낮음', suggestedRatio: 0.4  },
  { code: '360750', name: 'TIGER 미국S&P500', keyword: 'S&P500 ETF',     type: 'ETF',    volatility: '낮음', suggestedRatio: 0.3  },
  { code: '005930', name: '삼성전자',          keyword: '삼성전자 주가',   type: '대형주', volatility: '보통', suggestedRatio: 0.15 },
  { code: '091160', name: 'KODEX 반도체',      keyword: '반도체 ETF',     type: 'ETF',    volatility: '보통', suggestedRatio: 0.1  },
  { code: '305720', name: 'TIGER 2차전지',     keyword: '2차전지 ETF',    type: 'ETF',    volatility: '높음', suggestedRatio: 0.05 },
]

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
    const results = await Promise.all(
      STOCK_KEYWORDS.map(async (stock) => {
        const articles = await searchNaver(stock.keyword, clientId, clientSecret)
        return {
          code: stock.code,
          name: stock.name,
          type: stock.type,
          volatility: stock.volatility,
          marketCap: '대형',
          mentionCount: articles.length,
          trustScore: 70,
          trustLevel: '중립',
          trustReason: 'AI 분석 버튼을 눌러 실시간 신뢰도를 확인하세요.',
          policySignal: {
            strength: stock.code === '005930' || stock.code === '091160' ? '강함' :
                      stock.code === '305720' ? '보통' : '강함',
            industry: stock.code === '069500' ? '국내 증시 전반' :
                      stock.code === '360750' ? '해외 지수' : '반도체/2차전지',
            description: '정책 신호는 AI 분석에서 확인하세요.',
            warning: '정책은 참고 신호일 뿐, 수익 보장 아님',
          },
          summary: `${stock.name} — 최근 뉴스 ${articles.length}건 수집`,
          sources: [`네이버 뉴스 ${articles.length}건`],
          suggestedRatio: stock.suggestedRatio,
          articles: articles.slice(0, 3),
        }
      })
    )

    results.sort((a, b) => b.mentionCount - a.mentionCount)

    return res.status(200).json({ source: 'naver', stocks: results })

  } catch (error) {
    console.error('네이버 API 오류:', error)
    return res.status(200).json({ source: 'mock', stocks: getMockData() })
  }
}

const getMockData = () => [
  { code:'069500', name:'KODEX 200',        mentionCount:5, type:'ETF',   volatility:'낮음', marketCap:'대형', trustScore:85, trustLevel:'높음', trustReason:'ETF 구조로 과장 표현 없음.', policySignal:{strength:'강함', industry:'국내 증시 전반', description:'정부 증시 부양 정책', warning:'수익 보장 아님'}, summary:'국내 200개 대형주 ETF', sources:['네이버 뉴스 5건'], articles:[], suggestedRatio:0.4  },
  { code:'360750', name:'TIGER 미국S&P500', mentionCount:4, type:'ETF',   volatility:'낮음', marketCap:'대형', trustScore:88, trustLevel:'높음', trustReason:'미국 지수 추종 안정적.',     policySignal:{strength:'보통', industry:'해외 지수',       description:'미국 연준 동향',   warning:'환율 리스크'},         summary:'미국 S&P500 ETF',       sources:['네이버 뉴스 4건'], articles:[], suggestedRatio:0.3  },
  { code:'005930', name:'삼성전자',          mentionCount:5, type:'대형주', volatility:'보통', marketCap:'대형', trustScore:62, trustLevel:'중립', trustReason:'과장 표현 다수 포함.',     policySignal:{strength:'강함', industry:'반도체',           description:'K-반도체 정책',    warning:'단기 수익 보장 아님'}, summary:'국내 대표 반도체 기업', sources:['네이버 뉴스 5건'], articles:[], suggestedRatio:0.15 },
  { code:'091160', name:'KODEX 반도체',      mentionCount:3, type:'ETF',   volatility:'보통', marketCap:'대형', trustScore:74, trustLevel:'높음', trustReason:'ETF 구조, 정책 연계 높음.', policySignal:{strength:'강함', industry:'반도체',           description:'K-반도체 정책',    warning:'산업 집중 ETF'},       summary:'반도체 ETF',             sources:['네이버 뉴스 3건'], articles:[], suggestedRatio:0.1  },
  { code:'305720', name:'TIGER 2차전지',     mentionCount:2, type:'ETF',   volatility:'높음', marketCap:'대형', trustScore:48, trustLevel:'주의', trustReason:'과장 표현 다수.',           policySignal:{strength:'보통', industry:'2차전지',           description:'전기차 정책 연계', warning:'변동성 높음'},         summary:'2차전지 ETF. 주의 필요.', sources:['네이버 뉴스 2건'], articles:[], suggestedRatio:0.05 },
]
