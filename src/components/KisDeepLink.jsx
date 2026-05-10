import { useState } from "react"

export default function KisDeepLink({ code }) {
  const [status, setStatus] = useState("idle") // idle | trying | failed | success

  const handleKisLink = () => {
    setStatus("trying")

    const deepLink = `kis://stock?code=${code}`

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const storeUrl = isIOS
      ? 'https://apps.apple.com/kr/app/%ED%95%9C%EA%B5%AD%ED%88%AC%EC%9E%90%EC%A6%9D%EA%B6%8C/id1480393512'
      : 'https://play.google.com/store/apps/details?id=com.truefriend.cybosplus'

    const start = Date.now()
    window.location.href = deepLink

    setTimeout(() => {
      const elapsed = Date.now() - start
      if (elapsed < 2000) {
        setStatus("failed")
      } else {
        setStatus("success")
      }
    }, 1500)
  }

  const handleStoreRedirect = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const storeUrl = isIOS
      ? 'https://apps.apple.com/kr/app/%ED%95%9C%EA%B5%AD%ED%88%AC%EC%9E%90%EC%A6%9D%EA%B6%8C/id1480393512'
      : 'https://play.google.com/store/apps/details?id=com.truefriend.cybosplus'
    window.open(storeUrl, '_blank')
    setStatus("idle")
  }

  return (
    <div>
      {(status === "idle" || status === "success") && (
        <button
          onClick={handleKisLink}
          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          🏦 한국투자증권 앱으로 바로 보기
        </button>
      )}

      {status === "trying" && (
        <div className="w-full py-3 bg-gray-100 rounded-xl text-sm text-center text-gray-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          앱 연결 시도 중...
        </div>
      )}

      {status === "failed" && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-600 mb-2 font-medium">
            📱 한국투자증권 앱이 설치되어 있지 않아요
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleStoreRedirect}
              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              앱 설치하기
            </button>
            <button
              onClick={() => setStatus("idle")}
              className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold rounded-lg transition-colors"
            >
              다음에
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
