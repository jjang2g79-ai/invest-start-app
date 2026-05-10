export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' })
  }

  const { stockName, stockCode, sources, mentionCount, volatility, articles, marketData } = req.body

  if (!stockName) {
    return res.status(400).json({ error: '종목명이 필요합니다' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `당신은 초보 투자자를 위한 투자 정보 신뢰도 분석 AI입니다.
아래 종목 정보와 최신 뉴스를 분석하고 JSON 형식으로만 응답하세요.

종목명: ${stockName}
종목코드: ${stockCode}
언급 출처: ${sources?.join(', ')}
총 언급 횟수: ${mentionCount}회
변동성: ${volatility}
현재가: ${marketData?.currentPrice || '정보 없음'}
등락률: ${marketData?.changeRate || '0'}%
52주 최고: ${marketData?.high52 || '정보 없음'}
52주 최저: ${marketData?.low52 || '정보 없음'}

최신 뉴스 기사:
${articles?.length > 0
  ? articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n')
  : '뉴스 없음'
}

분석 기준:
1. 뉴스 제목에 "확정", "대박", "무조건" 등 과장 표현 있으면 신뢰도 낮춤
2. ETF는 개별주보다 신뢰도 높게 평가
3. 언급 횟수가 많을수록 신뢰도 가중치 부여
4. 초보 투자자 관점에서 쉽게 설명

다음 JSON 형식으로만 응답하세요 (마크다운 없이 순수 JSON):
{
  "trustScore": 0~100 사이 숫자,
  "trustLevel": "높음" 또는 "중립" 또는 "주의",
  "trustReason": "뉴스 내용 기반 신뢰도 판단 이유 2~3문장",
  "warnings": ["주의사항1", "주의사항2", "주의사항3"],
  "summary": "초보 투자자를 위한 한 줄 요약"
}`
          }
        ]
      })
    })

    const data = await response.json()

    const text = data.content?.[0]?.text
    if (!text) {
      throw new Error('Claude 응답 없음')
    }

    // 마크다운 코드블록 제거 후 JSON 파싱
    // Claude가 ```json ... ``` 형태로 반환하는 경우 처리
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const result = JSON.parse(cleaned)
    return res.status(200).json(result)

  } catch (error) {
    console.error('분석 오류:', error)
    return res.status(500).json({ error: '분석 중 오류가 발생했습니다' })
  }
}
