import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { saveInvestAmount, getInvestAmount } from "../utils/storage"

export default function Home() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState(() => {
    const saved = getInvestAmount()
    return saved ? String(saved) : ""
  })
  const [error, setError] = useState("")

  const quickAmounts = [50000, 100000, 300000, 500000]

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setAmount(value)
    setError("")
  }

  const handleQuickAmount = (value) => {
    setAmount(String(value))
    setError("")
  }

  const handleNext = () => {
    const num = Number(amount)
    if (!amount || num < 10000) {
      setError("최소 1만원 이상 입력해주세요")
      return
    }
    if (num > 10000000) {
      setError("1,000만원 이하로 입력해주세요")
      return
    }
    saveInvestAmount(num)
    navigate("/tendency")
  }

  const formatKorean = (value) => {
    const num = Number(value)
    if (!num) return ""
    if (num >= 10000) {
      const man = Math.floor(num / 10000)
      const rest = num % 10000
      return rest > 0 ? `${man}만 ${rest.toLocaleString()}원` : `${man}만원`
    }
    return `${num.toLocaleString()}원`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col px-5 py-8">

        {/* 헤더 */}
        <div className="flex flex-col items-center text-center mb-10 mt-6">
          <div className="text-5xl mb-4">📈</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            오늘 투자 시작하기
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            얼마로 시작할지 입력하면<br />
            데이터 기반으로 종목 정보를 요약해드려요
          </p>
        </div>

        {/* 투자금 입력 */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            시작 투자금액
          </label>

          {/* 금액 입력창 */}
          <div className="flex items-center border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors bg-white">
            <span className="text-gray-400 mr-2 text-lg">₩</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              className="flex-1 text-2xl font-bold text-gray-900 outline-none text-right"
            />
            <span className="text-gray-400 ml-2 text-base">원</span>
          </div>

          {/* 한국어 금액 표시 */}
          <div className="h-6 mt-1 text-right text-sm text-blue-500 font-medium">
            {formatKorean(amount)}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-1 text-sm text-red-500 font-medium">
              {error}
            </div>
          )}

          {/* 빠른 금액 선택 */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {quickAmounts.map((v) => (
              <button
                key={v}
                onClick={() => handleQuickAmount(v)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors
                  ${Number(amount) === v
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {v >= 10000 ? `${v / 10000}만` : v.toLocaleString()}
              </button>
            ))}
          </div>

          {/* 안내 문구 */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-700 leading-relaxed">
              ⚠️ 이 서비스는 투자 추천이 아닌 데이터 요약 서비스입니다.<br />
              제공되는 정보는 참고용이며, 투자 손익의 책임은 본인에게 있습니다.
            </p>
          </div>
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={handleNext}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-colors mt-6"
        >
          성향 선택하기 →
        </button>

        {/* 하단 안내 */}
        <p className="text-center text-xs text-gray-400 mt-3">
          실제 투자는 증권사 앱에서 직접 진행합니다
        </p>

      </div>
    </div>
  )
}
