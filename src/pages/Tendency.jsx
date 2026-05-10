import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { saveTendency, getInvestAmount } from "../utils/storage"

const TENDENCIES = [
  {
    id: "safe",
    emoji: "🛡️",
    title: "안전 중심",
    subtitle: "잃지 않는 게 먼저예요",
    tags: ["ETF 위주", "저변동성", "분산투자"],
    color: "border-green-400 bg-green-50",
    selectedColor: "border-green-500 bg-green-100",
    tagColor: "bg-green-100 text-green-700",
    textColor: "text-green-700",
  },
  {
    id: "balance",
    emoji: "⚖️",
    title: "균형 투자",
    subtitle: "적당한 수익, 적당한 안정",
    tags: ["ETF + 대형주", "중간 변동성", "정책 연계"],
    color: "border-blue-400 bg-blue-50",
    selectedColor: "border-blue-500 bg-blue-100",
    tagColor: "bg-blue-100 text-blue-700",
    textColor: "text-blue-700",
  },
  {
    id: "growth",
    emoji: "🚀",
    title: "성장 추구",
    subtitle: "변동성 감수하고 수익 노려요",
    tags: ["테마 ETF", "고변동성 포함", "성장 산업"],
    color: "border-orange-400 bg-orange-50",
    selectedColor: "border-orange-500 bg-orange-100",
    tagColor: "bg-orange-100 text-orange-700",
    textColor: "text-orange-700",
  },
]

export default function Tendency() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const amount = getInvestAmount()

  const handleNext = () => {
    if (!selected) return
    saveTendency(selected)
    navigate("/result")
  }

  const handleBack = () => {
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col px-5 py-8">

        {/* 뒤로가기 + 헤더 */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
          >
            ← 뒤로
          </button>
          <div className="text-center">
            <div className="inline-block bg-blue-50 text-blue-600 text-sm font-medium px-3 py-1 rounded-full mb-3">
              투자금:{" "}
              <span className="font-bold">
                {amount ? `${(amount / 10000).toFixed(0)}만원` : "-"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              어떤 스타일로 시작할까요?
            </h1>
            <p className="text-sm text-gray-500">
              성향에 맞는 종목 데이터를 요약해드려요
            </p>
          </div>
        </div>

        {/* 성향 선택 카드 */}
        <div className="flex flex-col gap-3 flex-1">
          {TENDENCIES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                ${selected === t.id ? t.selectedColor : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{t.emoji}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-bold text-base ${selected === t.id ? t.textColor : "text-gray-800"}`}>
                      {t.title}
                    </span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0
                      ${selected === t.id ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"}`}
                    >
                      {selected === t.id && "✓"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{t.subtitle}</p>

                  <div className="flex flex-wrap gap-1">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-0.5 rounded-full ${selected === t.id ? t.tagColor : "bg-gray-100 text-gray-500"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 주의 문구 */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-700 leading-relaxed">
            ⚠️ 성향 선택은 데이터 필터링 기준입니다.<br />
            투자 결과를 보장하지 않습니다.
          </p>
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={handleNext}
          disabled={!selected}
          className={`w-full font-bold py-4 rounded-xl text-lg transition-colors mt-4
            ${selected
              ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          {selected ? "종목 데이터 보기 →" : "성향을 선택해주세요"}
        </button>

      </div>
    </div>
  )
}
