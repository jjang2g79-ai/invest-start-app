export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const kospiStocks  = await fetchTopStocks('kospi')
    const kosdaqStocks = await fetchTopStocks('kosdaq')

    const allStocks = [...kospiStocks, ...kosdaqStocks]

    const unique = allStocks.filter(
      (stock, idx, self) => self.findIndex(s => s.code === stock.code) === idx
    )

    const top20 = unique.slice(0, 20)

    return res.status(200).json({ stocks: top20 })

  } catch (error) {
    console.error('종목 수집 오류:', error)
    return res.status(200).json({ stocks: getDefaultStocks() })
  }
}

const fetchTopStocks = async (market) => {
  try {
    const url = market === 'kospi'
      ? 'https://finance.naver.com/sise/sise_quant.naver?sosok=0'
      : 'https://finance.naver.com/sise/sise_quant.naver?sosok=1'

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return []
    const html = await res.text()

    const stocks = []
    const pattern = /href="\/item\/main\.naver\?code=(\d{6})">([^<]+)<\/a>/g
    let match

    while ((match = pattern.exec(html)) !== null && stocks.length < 20) {
      const code = match[1]
      const name = match[2].trim()

      const isETF = name.includes('ETF') ||
                    name.includes('KODEX') ||
                    name.includes('TIGER') ||
                    name.includes('KINDEX') ||
                    name.includes('HANARO') ||
                    name.includes('ARIRANG')

      const isExcluded = name.includes('레버리지') ||
                         name.includes('인버스') ||
                         name.includes('곱버스') ||
                         name.includes('2X') ||
                         name.includes('선물')

      if (!isExcluded) {
        stocks.push({
          code,
          name,
          type: isETF ? 'ETF' : '대형주',
          market: market === 'kospi' ? 'KOSPI' : 'KOSDAQ',
          volatility: isETF ? '낮음' : '보통',
          marketCap: '대형',
          suggestedRatio: isETF ? 0.2 : 0.1,
        })
      }
    }

    return stocks

  } catch {
    return []
  }
}

const getDefaultStocks = () => [
  { code: '069500', name: 'KODEX 200',        type: 'ETF',    market: 'KOSPI', volatility: '낮음', marketCap: '대형', suggestedRatio: 0.2  },
  { code: '360750', name: 'TIGER 미국S&P500', type: 'ETF',    market: 'KOSPI', volatility: '낮음', marketCap: '대형', suggestedRatio: 0.2  },
  { code: '005930', name: '삼성전자',          type: '대형주', market: 'KOSPI', volatility: '보통', marketCap: '대형', suggestedRatio: 0.1  },
  { code: '091160', name: 'KODEX 반도체',      type: 'ETF',    market: 'KOSPI', volatility: '보통', marketCap: '대형', suggestedRatio: 0.1  },
  { code: '305720', name: 'TIGER 2차전지',     type: 'ETF',    market: 'KOSPI', volatility: '높음', marketCap: '대형', suggestedRatio: 0.05 },
]
