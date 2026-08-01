export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  if (m <= 0) return 0
  return weightKg / (m * m)
}

function clamp(min: number, max: number, v: number): number {
  return Math.min(max, Math.max(min, v))
}

// Larghezza corporea relativa: 1.0 a BMI 22, cresce ~ come sqrt(BMI) a parita di altezza.
export function widthScaleFromBmi(bmiVal: number): number {
  if (!bmiVal) return 1
  return clamp(0.78, 1.65, Math.sqrt(bmiVal / 22))
}

// Fattore "pancia" per la vista di profilo (0 a BMI<=22, cresce oltre).
export function bellyFromBmi(bmiVal: number): number {
  if (!bmiVal) return 0
  return clamp(0, 1.6, (bmiVal - 22) / 10)
}
