/** קלוריות לפריט: לפי יחידה (kcal ליחידה) או לפי גרם (kcal ל-100 גרם, כמו על האריזה) */
export const itemKcal = (it) => (it.unit === 'g' ? (it.qty * it.kcal) / 100 : it.qty * it.kcal)
export const mealKcal = (meal) => meal.items.reduce((sum, it) => sum + itemKcal(it), 0)
export const menuTotal = (menu) => (menu?.meals ?? []).reduce((sum, m) => sum + mealKcal(m), 0)
export const fmtKcal = (n) => Math.round(n).toLocaleString('he-IL')

/** מוצרים בסיסיים להתחלה — ערכים משוערים, אפשר לשנות */
export const BASIC_FOODS = [
  { name: 'ביצה', unit: 'unit', kcal: 75 },
  { name: 'פרוסת לחם מלא', unit: 'unit', kcal: 70 },
  { name: 'פרוסת לחם לבן', unit: 'unit', kcal: 75 },
  { name: 'פיתה', unit: 'unit', kcal: 250 },
  { name: 'גבינה לבנה 5%', unit: 'g', kcal: 95 },
  { name: 'קוטג׳ 5%', unit: 'g', kcal: 95 },
  { name: 'גבינה צהובה 28%', unit: 'g', kcal: 350 },
  { name: 'יוגורט 3%', unit: 'g', kcal: 65 },
  { name: 'חלב 3%', unit: 'g', kcal: 60 },
  { name: 'שיבולת שועל', unit: 'g', kcal: 380 },
  { name: 'חזה עוף (מבושל)', unit: 'g', kcal: 165 },
  { name: 'טונה במים', unit: 'g', kcal: 110 },
  { name: 'סלמון', unit: 'g', kcal: 210 },
  { name: 'אורז לבן (מבושל)', unit: 'g', kcal: 130 },
  { name: 'פסטה (מבושלת)', unit: 'g', kcal: 155 },
  { name: 'תפוח אדמה (מבושל)', unit: 'g', kcal: 87 },
  { name: 'בטטה (אפויה)', unit: 'g', kcal: 90 },
  { name: 'עדשים (מבושלות)', unit: 'g', kcal: 115 },
  { name: 'חומוס (ממרח)', unit: 'g', kcal: 250 },
  { name: 'טחינה גולמית', unit: 'g', kcal: 600 },
  { name: 'שמן זית (כף)', unit: 'unit', kcal: 120 },
  { name: 'אבוקדו', unit: 'g', kcal: 160 },
  { name: 'בננה', unit: 'unit', kcal: 105 },
  { name: 'תפוח', unit: 'unit', kcal: 80 },
  { name: 'סלט ירקות (קערה)', unit: 'unit', kcal: 60 },
  { name: 'שקדים', unit: 'g', kcal: 580 },
  { name: 'אבקת חלבון (סקופ)', unit: 'unit', kcal: 120 },
]
