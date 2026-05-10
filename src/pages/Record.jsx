import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getRecords } from "../utils/storage"

export default function Record() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])

  useEffect(() => {
    setRecords(getRecords())
  }, [])

  const handleDelete = (id) => {
    const updated = records.filter((r) => r.id !== id)
    setRecords(updated)
    localStorage.setItem("records", JSON.stringify(updated))
  }

  const handleClearAll = () => {
    if (!window.confirm("전체 기록을 삭제할까요?")) return
    setRecords([])
    localStorage.removeItem("records")
  }

  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0)

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
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-gray-900">📋 내 투자 기록</h1>
            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                전체 삭제
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">저장한 종목 기록 · 참고용 데이터</p>
        </div>

        {/* 총합 카드 */}
        {records.length > 0 && (
          <div className="mx-4 mt-4 bg-blue-500 rounded-2xl p-4 text-white">
            <p className="text-xs text-blue-100 mb-1">총 배분 참고금액</p>
            <p className="text-3xl font-bold mb-1">
              {(totalAmount / 10000).toFixed(1)}만원
            </p>
            <p className="text-xs text-blue-200">
              {records.length}개 종목 · 참고용 수치입니다
            </p>
          </div>
        )}

        {/* 기록 목록 */}
        <div className="flex flex-col gap-3 px-4 pt-4 pb-28">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-base font-bold text-gray-700 mb-2">저장된 기록이 없어요</p>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                종목 상세 화면에서<br />"투자 기록에 저장"을 눌러보세요
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                투자 시작하기
              </button>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center"
              >
                {/* 종목명 + 날짜 + 금액 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">{record.name}</span>
                    <span className="text-xs text-gray-400">#{record.code}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{record.date}</p>
                  <span className="text-sm font-bold text-blue-600">
                    약 {record.amount >= 10000
                      ? `${(record.amount / 10000).toFixed(1)}만원`
                      : `${record.amount.toLocaleString()}원`
                    }
                  </span>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => handleDelete(record.id)}
                  className="ml-3 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors text-xl flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* 하단 안내 */}
        {records.length > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 leading-relaxed">
                ⚠️ 기록은 참고용입니다. 실제 투자는 증권사 앱에서 직접 진행하세요.<br />
                이 앱은 투자 추천 서비스가 아닙니다.
              </p>
            </div>
          </div>
        )}

        {/* 하단 고정 버튼 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
          >
            🏠 처음부터 다시 시작
          </button>
        </div>

      </div>
    </div>
  )
}
