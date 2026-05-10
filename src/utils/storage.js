// 📌 localStorage 헬퍼 함수 모음

export const saveInvestAmount = (amount) => {
  localStorage.setItem("investAmount", JSON.stringify(amount))
}

export const getInvestAmount = () => {
  const data = localStorage.getItem("investAmount")
  return data ? JSON.parse(data) : null
}

export const saveTendency = (tendency) => {
  localStorage.setItem("tendency", JSON.stringify(tendency))
}

export const getTendency = () => {
  const data = localStorage.getItem("tendency")
  return data ? JSON.parse(data) : null
}

export const saveRecord = (record) => {
  const existing = getRecords()
  const updated = [...existing, { ...record, id: Date.now(), date: new Date().toLocaleDateString("ko-KR") }]
  localStorage.setItem("records", JSON.stringify(updated))
}

export const getRecords = () => {
  const data = localStorage.getItem("records")
  return data ? JSON.parse(data) : []
}
