import { useParams, useNavigate, useLocation } from "react-router-dom"
import { getInvestAmount, saveRecord } from "../utils/storage"
import { mockStocks } from "../data/mockStocks"
import { useState } from "react"
import KisDeepLink from "../components/KisDeepLink"

const trustStyle = {
  높음: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", icon: "✅" },
  중립: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", icon: "⚠️" },
  주의: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", icon: "🚨" },
}

const policyStyle = {
  강함: { color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-500", width: "w-full" },
  보통: { color: "text-gray-600", bg: "bg-gray-50", bar: "bg-gray-400", width: "w-1/2" },
  없음: { color: "text-gray-400", bg: "bg-gray-50", bar: "bg-gray-200", width: "w-1/4" },
}

export default function Detail() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const amount = getInvestAmount()
  const [recorded, setRecorded] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState("")

  const stock = location.state?.stock || mockStocks.find((s) => s.code === code)

  if (!stock) {
    navigate("/result")
    return null
  }

  const trust = trustStyle[stock.trustLevel]
  const policy = policyStyle[stock.policySignal.strength]

  const allocAmount = Math.round((amount * stock.suggestedRatio) / 1000) * 1000
  const allocMan = (allocAmount / 10000).toFixed(1)

  const handleAiAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalyzeError("")

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockName: stock.name,
          stockCode: stock.code,
          sources: stock.sources,
          mentionCount: stock.mentionCount,
          volatility: stock.volatility
        })
      })

      if (!response.ok) throw new Error('분석 실패')

      const result = await response.json()
      setAiAnalysis(result)
    } catch (err) {
      setAnalyzeError("AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRecord = () => {
    saveRecord({
      code: stock.code,
      name: stock.name,
      amount: allocAmount,
      tendency: "기록됨",
    })
    setRecorded(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(stock.code)
    alert(`${stock.code} 복사됨! 증권사 앱에서 검색하세요.`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-gray-50 min-h-screen flex flex-col">

        {/* 상단 헤더 */}
        <div className="bg-white px-5 pt-8 pb-4 shadow-sm">
          <button
            onClick={() => navigate("/result")}
            className="text-gray-400 text-sm mb-3 flex items-center gap-1 hover:text-gray-600"
          >
            ← 결과로
          </button>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">{stock.type}</span>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">{stock.name}</h1>
              <span className="text-xs text-gray-400">#{stock.code}</span>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ml-3 ${trust.badge}`}>
              {trust.icon} 신뢰도 {stock.trustLevel}
            </span>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex flex-col gap-4 px-4 pt-4 pb-28">

          {/* 요약 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-2">📋 종목 요약</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{stock.summary}</p>
            <div className="flex flex-wrap gap-2">
              {stock.sources.map((src) => (
                <span key={src} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* 관련 뉴스 목록 */}
          {stock.articles && stock.articles.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-3">📰 관련 최신 뉴스</h2>
              <div className="flex flex-col gap-2">
                {stock.articles.map((article, i) => (
                  <a
                    key={i}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm text-gray-800 font-medium leading-relaxed mb-1">
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(article.pubDate).toLocaleDateString('ko-KR')} · 기사 보기 →
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 신뢰도 분석 */}
          <div className={`rounded-2xl p-4 border ${trust.bg} ${trust.border}`}>
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              {trust.icon} 신뢰도 분석
            </h2>
            {/* 신뢰도 점수 바 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${stock.trustScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                {stock.trustScore}점
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{stock.trustReason}</p>
          </div>

          {/* 정책 신호 */}
          <div className={`rounded-2xl p-4 border border-gray-100 ${policy.bg}`}>
            <h2 className="text-sm font-bold text-gray-700 mb-3">🏛️ 정책 신호</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{stock.policySignal.industry}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white ${policy.color}`}>
                {stock.policySignal.strength}
              </span>
            </div>
            {/* 정책 강도 바 */}
            <div className="bg-gray-200 rounded-full h-2 mb-3">
              <div className={`${policy.bar} ${policy.width} h-2 rounded-full transition-all`} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              {stock.policySignal.description}
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              ⚠️ {stock.policySignal.warning}
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">언급 횟수</p>
              <p className="text-xl font-bold text-gray-900">{stock.mentionCount}</p>
              <p className="text-xs text-gray-400">회</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">변동성</p>
              <p className="text-base font-bold text-gray-900 mt-1">{stock.volatility}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">시가총액</p>
              <p className="text-base font-bold text-gray-900 mt-1">{stock.marketCap}</p>
            </div>
          </div>

          {/* 배분 금액 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-1">💰 배분 참고금액</h2>
            <p className="text-xs text-gray-400 mb-3">
              투자금 {(amount / 10000).toFixed(0)}만원의 {(stock.suggestedRatio * 100).toFixed(0)}% 기준
            </p>
            <div className="text-center py-3 bg-blue-50 rounded-xl">
              <span className="text-2xl font-bold text-blue-600">약 {allocMan}만원</span>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">참고용 수치입니다. 직접 조정하세요.</p>
          </div>

          {/* AI 신뢰도 분석 섹션 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">🤖 AI 심층 분석</h2>
              {!aiAnalysis && (
                <button
                  onClick={handleAiAnalyze}
                  disabled={isAnalyzing}
                  className={`text-sm px-4 py-2 rounded-xl font-medium transition-all
                    ${isAnalyzing
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                  {isAnalyzing ? "분석 중..." : "AI 분석 시작"}
                </button>
              )}
            </div>

            {!aiAnalysis && !isAnalyzing && (
              <p className="text-xs text-gray-400">
                AI가 이 종목의 언급 패턴과 신뢰도를 심층 분석합니다
              </p>
            )}

            {isAnalyzing && (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">AI가 분석하고 있어요...</p>
              </div>
            )}

            {analyzeError && (
              <p className="text-sm text-red-500">{analyzeError}</p>
            )}

            {aiAnalysis && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${aiAnalysis.trustScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{aiAnalysis.trustScore}점</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${aiAnalysis.trustLevel === "높음" ? "bg-green-100 text-green-700"
                      : aiAnalysis.trustLevel === "중립" ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"}`}>
                    {aiAnalysis.trustLevel}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{aiAnalysis.trustReason}</p>

                {aiAnalysis.warnings?.length > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-medium text-yellow-700 mb-1">⚠️ 주의사항</p>
                    {aiAnalysis.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-yellow-600">• {w}</p>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-700">💡 {aiAnalysis.summary}</p>
                </div>

                <button
                  onClick={handleAiAnalyze}
                  className="mt-3 text-xs text-gray-400 underline hover:text-gray-600"
                >
                  다시 분석하기
                </button>
              </div>
            )}
          </div>

          {/* 투자 실행 연결 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-1">🔗 투자 실행 연결</h2>
            <p className="text-xs text-gray-500 mb-3">
              아래 종목코드를 복사해서 증권사 앱에서 검색 후 직접 매수하세요
            </p>

            {/* 종목코드 복사 */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <div>
                <p className="text-xs text-gray-400">종목코드</p>
                <p className="text-lg font-bold text-gray-800">{stock.code}</p>
              </div>
              <button
                onClick={handleCopy}
                className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-xl transition-colors"
              >
                복사
              </button>
            </div>

            {/* 한국투자증권 딥링크 */}
            <KisDeepLink code={stock.code} />

            {/* 증권사 정보 페이지 버튼 */}
            <p className="text-xs text-gray-400 mb-2 mt-4">📊 종목 정보 확인</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://m.stock.naver.com/domestic/stock/${stock.code}/total`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                네이버
              </a>
              <a
                href={`https://finance.daum.net/quotes/A${stock.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-bold rounded-xl transition-colors"
              >
                카카오
              </a>
              <a
                href={`https://tossinvest.com/stocks/${stock.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                토스
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              ⚠️ 정보 확인 후 매수는 앱에서 직접 진행하세요
            </p>
          </div>

        </div>

        {/* 하단 고정 버튼 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <button
            onClick={handleRecord}
            disabled={recorded}
            className={`flex-1 py-3 font-bold rounded-xl text-sm transition-colors
              ${recorded
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
          >
            {recorded ? "✅ 기록 완료" : "📋 투자 기록에 저장"}
          </button>
          <button
            onClick={() => navigate("/result")}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
          >
            목록
          </button>
        </div>

      </div>
    </div>
  )
}
