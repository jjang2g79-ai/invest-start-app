const STOCK_KEYWORDS = [
  { code: '069500', name: 'KODEX 200',        keywords: ['KODEX 200', '코덱스200', '코스피200 ETF'] },
  { code: '360750', name: 'TIGER 미국S&P500', keywords: ['S&P500', 'SP500', '미국 ETF', '타이거 미국'] },
  { code: '005930', name: '삼성전자',          keywords: ['삼성전자', '삼성 반도체'] },
  { code: '091160', name: 'KODEX 반도체',      keywords: ['KODEX 반도체', '반도체 ETF', 'K-반도체'] },
  { code: '305720', name: 'TIGER 2차전지',     keywords: ['2차전지', '배터리 ETF', '이차전지'] },
]

const RSS_FEEDS = [
  'https://feeds.feedburner.com/navernews/economy',
  'https://rss.etnews.com/Section901.xml',
  'https://www.hankyung.com/feed/economy',
  'https://rss.joins.com/joins_economy_list.xml',
]

const parseRSS = (xml) => {
  const items = []
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

  itemMatches.forEach((item) => {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       item.match(/<title>(.*?)<\/title>/)
    const descMatch  = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                       item.match(/<description>(.*?)<\/description>/)

    if (titleMatch) {
      items.push({
        title: titleMatch[1] || '',
        description: descMatch?.[1] || '',
      })
    }
  })
  return items
}

const fetchRSS = async (url) => {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSS(xml)
  } catch {
    return []
  }
}

const countMentions = (items, keywords) => {
  let count = 0
  items.forEach(({ title, description }) => {
    const text = `${title} ${description}`.toLowerCase()
    keywords.forEach((kw) => {
      if (text.includes(kw.toLowerCase())) count++
    })
  })
  return count
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const allItems = (
      await Promise.all(RSS_FEEDS.map(fetchRSS))
    ).flat()

    if (allItems.length === 0) {
      return res.status(200).json({ source: 'mock', stocks: getMockData() })
    }

    const stocks = STOCK_KEYWORDS.map((stock) => {
      const mentionCount = countMentions(allItems, stock.keywords)
      return {
        code: stock.code,
        name: stock.name,
        mentionCount,
        type:       stock.code === '005930' ? '대형주' : 'ETF',
        volatility: stock.code === '305720' ? '높음' : stock.code === '005930' ? '보통' : '낮음',
        marketCap:  '대형',
        trustScore: 70,
        trustLevel: '중립',
        trustReason: 'AI 분석 버튼을 눌러 실시간 신뢰도를 확인하세요.',
        policySignal: {
          strength:    stock.code === '005930' || stock.code === '091160' ? '강함' :
                       stock.code === '305720' ? '보통' : '강함',
          industry:    stock.code === '069500' ? '국내 증시 전반' :
                       stock.code === '360750' ? '해외 지수' : '반도체/2차전지',
          description: '정책 신호는 AI 분석에서 확인하세요.',
          warning:     '정책은 참고 신호일 뿐, 수익 보장 아님',
        },
        summary: `${stock.name} — 뉴스·유튜브 실시간 언급 데이터`,
        sources: [`뉴스 ${mentionCount}회 언급`],
        suggestedRatio: stock.code === '069500' ? 0.4 :
                        stock.code === '360750' ? 0.3 :
                        stock.code === '005930' ? 0.15 :
                        stock.code === '091160' ? 0.1 : 0.05,
      }
    })

    stocks.sort((a, b) => b.mentionCount - a.mentionCount)

    return res.status(200).json({ source: 'rss', stocks })

  } catch (error) {
    console.error('RSS 수집 오류:', error)
    return res.status(200).json({ source: 'mock', stocks: getMockData() })
  }
}

const getMockData = () => [
  { code:'069500', name:'KODEX 200',        mentionCount:142, type:'ETF',   volatility:'낮음', marketCap:'대형', trustScore:85, trustLevel:'높음', trustReason:'ETF 구조로 과장 표현 없음.', policySignal:{strength:'강함', industry:'국내 증시 전반', description:'정부 증시 부양 정책', warning:'수익 보장 아님'}, summary:'국내 200개 대형주 ETF', sources:['유튜브 89회','뉴스 53회'], suggestedRatio:0.4 },
  { code:'360750', name:'TIGER 미국S&P500', mentionCount:118, type:'ETF',   volatility:'낮음', marketCap:'대형', trustScore:88, trustLevel:'높음', trustReason:'미국 지수 추종 안정적.',     policySignal:{strength:'보통', industry:'해외 지수',       description:'미국 연준 동향',     warning:'환율 리스크'}, summary:'미국 S&P500 ETF',       sources:['유튜브 74회','뉴스 44회'], suggestedRatio:0.3  },
  { code:'005930', name:'삼성전자',          mentionCount:203, type:'대형주', volatility:'보통', marketCap:'대형', trustScore:62, trustLevel:'중립', trustReason:'과장 표현 다수 포함.',     policySignal:{strength:'강함', industry:'반도체',           description:'K-반도체 정책',      warning:'단기 수익 보장 아님'}, summary:'국내 대표 반도체 기업', sources:['유튜브 131회','뉴스 72회'], suggestedRatio:0.15 },
  { code:'091160', name:'KODEX 반도체',      mentionCount:97,  type:'ETF',   volatility:'보통', marketCap:'대형', trustScore:74, trustLevel:'높음', trustReason:'ETF 구조, 정책 연계 높음.', policySignal:{strength:'강함', industry:'반도체',           description:'K-반도체 정책',      warning:'산업 집중 ETF'}, summary:'반도체 ETF',             sources:['유튜브 58회','뉴스 39회'], suggestedRatio:0.1  },
  { code:'305720', name:'TIGER 2차전지',     mentionCount:76,  type:'ETF',   volatility:'높음', marketCap:'대형', trustScore:48, trustLevel:'주의', trustReason:'과장 표현 다수.',           policySignal:{strength:'보통', industry:'2차전지',         description:'전기차 정책 연계',   warning:'변동성 높음'}, summary:'2차전지 ETF. 주의 필요.', sources:['유튜브 51회','뉴스 25회'], suggestedRatio:0.05 },
]
