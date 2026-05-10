import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getInvestAmount, getTendency } from "../utils/storage"
import { mockStocks as fallbackStocks } from "../data/mockStocks"

const filterByTendency = (stocks, tendency) => {
  if (tendency === "safe") {
    return stocks.filter((s) => s.type === "ETF" && s.volatility === "낮음")
  }
  if (tendency === "balance") {
    return stocks.filter((s) => s.volatility !== "높음")
  }
  if (tendency === "growth") {
    return [...stocks].sort((a, b) => b.trustScore - a.trustScore)
  }
  return stocks
}

const tendencyLabel = {
  safe: "🛡️ 안전 중심",
  balance: "⚖️ 균형 투자",
  growth: "🚀 성장 추구",
}

const trustColor = {
  높음: "bg-green-100 text-green-700",
  중립: "bg-yellow-100 text-yellow-700",
  주의: "bg-red-100 text-red-700",
}

const policyColor = {
  강함: "text-blue-600",
  보통: "text-gray-500",
  없음: "text-gray-300",
}

const formatAllocAmount = (amount, ratio) => {
  const raw = Math.round((amount * ratio) / 1000) * 1000
  if (raw >= 10000) {
    return `약 ${(raw / 10000).toFixed(1)}만원`
  }
  return `약 ${raw.toLocaleString()}원`
}

export default function Result() {
  const navigate = useNavigate()
  const amount = getInvestAmount()
  const tendency = getTendency()

  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState('')

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/news')
        const data = await res.json()
        setStocks(data.stocks)
        setDataSource(data.source)
      } catch {
        setStocks(fallbackStocks)
        setDataSource('mock')
      } finally {
        setLoading(false)
      }
    }
    fetchStocks()
  }, [])

  if (!amount || !tendency) {
    navigate("/")
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">뉴스 데이터 수집 중...</p>
      </div>
    )
  }

  const filtered = filterByTendency(stocks, tendency)

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-gray-50 min-h-screen flex flex-col">

        {/* 상단 헤더 */}
        <div className="bg-white px-5 pt-8 pb-4 sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => navigate("/tendency")}
            className="text-gray-400 text-sm mb-3 flex items-center gap-1 hover:text-gray-600"
          >
            ← 뒤로
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">데이터 요약 결과</h1>
            <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              {tendencyLabel[tendency]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            투자금{" "}
            <span className="font-semibold text-gray-600">
              {(amount / 10000).toFixed(0)}만원
            </span>{" "}
            기준 · 언급 빈도 데이터 요약
          </p>
        </div>

        {/* 안내 배너 */}
        <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-700 leading-relaxed">
            📊 {dataSource === 'naver' ? '네이버 뉴스' : dataSource === 'rss' ? '실시간 뉴스' : '기본'} 데이터 기준
            <strong> 많이 언급된 종목</strong>을 요약한 정보입니다.<br />
            투자 추천이 아니며, 실제 투자는 증권사 앱에서 직접 진행하세요.
          </p>
        </div>

        {/* 종목 카드 목록 */}
        <div className="flex flex-col gap-3 px-4 pt-4 pb-24">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-4xl mb-3">😅</span>
              <p className="text-sm">해당 성향에 맞는 종목 데이터가 없어요</p>
            </div>
          ) : (
            filtered.map((stock) => (
              <button
                key={stock.code}
                onClick={() => navigate(`/detail/${stock.code}`, { state: { stock } })}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-sm active:scale-95 transition-all"
              >
                {/* 종목명 + 신뢰도 배지 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium mb-0.5">
                      {stock.type}
                    </span>
                    <span className="font-bold text-gray-900 text-base leading-tight">
                      {stock.name}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">#{stock.code}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${trustColor[stock.trustLevel]}`}>
                    신뢰도 {stock.trustLevel}
                  </span>
                </div>

                {/* 요약 */}
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{stock.summary}</p>

                {/* 통계 행 */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400">언급</span>
                    <span className="text-sm font-bold text-gray-800">{stock.mentionCount}회</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400">변동성</span>
                    <span className="text-sm font-bold text-gray-800">{stock.volatility}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400">정책</span>
                    <span className={`text-sm font-bold ${policyColor[stock.policySignal.strength]}`}>
                      {stock.policySignal.strength}
                    </span>
                  </div>
                </div>

                {/* 한투 시장 데이터 */}
                {stock.marketData && (
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-gray-800">
                      ₩{stock.marketData.currentPrice}
                    </span>
                    <span className={`text-sm font-medium ${
                      stock.marketData.changeSign === '2' || stock.marketData.changeSign === '1'
                        ? 'text-red-500'
                        : stock.marketData.changeSign === '4' || stock.marketData.changeSign === '5'
                        ? 'text-blue-500'
                        : 'text-gray-500'
                    }`}>
                      {stock.marketData.changeSign === '2' || stock.marketData.changeSign === '1' ? '▲' :
                       stock.marketData.changeSign === '4' || stock.marketData.changeSign === '5' ? '▼' : '-'}
                      {stock.marketData.changeRate}%
                    </span>
                    <span className="text-xs text-gray-400">거래량 {stock.marketData.volume}</span>
                  </div>
                )}

                {/* 금액 배분 */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">배분 참고금액</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatAllocAmount(amount, stock.suggestedRatio)}
                  </span>
                </div>

                <div className="text-right text-xs text-gray-400 mt-2">
                  상세 보기 →
                </div>
              </button>
            ))
          )}
        </div>

        {/* 하단 고정 버튼 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={() => navigate("/record")}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
          >
            📋 내 투자 기록 보기
          </button>
        </div>

      </div>
    </div>
  )
}
