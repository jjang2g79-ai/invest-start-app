export const calcBuyable = (investAmount, suggestedRatio, currentPrice) => {
  if (!currentPrice) return null

  const price = Number(String(currentPrice).replace(/,/g, ''))
  if (!price) return null

  const allocAmount = Math.floor(investAmount * suggestedRatio)
  const buyableShares = Math.floor(allocAmount / price)
  const actualAmount = buyableShares * price

  return {
    price,
    allocAmount,
    buyableShares,
    actualAmount,
    minRequired: price,
    canBuy: buyableShares >= 1,
    leftover: allocAmount - actualAmount,
  }
}

export const formatKRW = (amount) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}만원`
  }
  return `${amount.toLocaleString('ko-KR')}원`
}
