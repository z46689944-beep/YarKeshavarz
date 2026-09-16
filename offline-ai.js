import agricultureDB from "./agriculture-db.js";

function findOfflineAnswer(question) {
  const text = question.toLowerCase();

  let bestMatch = null;
  let score = 0;

  for (const item of agricultureDB) {
    let currentScore = 0;

    for (const key of item.keywords || []) {
      if (text.includes(key.toLowerCase())) {
        currentScore++;
      }
    }

    if (currentScore > score) {
      score = currentScore;
      bestMatch = item;
    }
  }

  if (!bestMatch) {
    return `
🌱 یار کشاورز آفلاین

اطلاعات کافی برای این سؤال پیدا نکردم.
لطفاً نام محصول، مشکل گیاه یا نشانه‌ها را دقیق‌تر بنویسید.
`;
  }

  let answer = `🌱 ${bestMatch.topic}\n\n`;

  if (bestMatch.symptoms) {
    answer += `🔎 نشانه‌ها:\n${bestMatch.symptoms}\n\n`;
  }

  if (bestMatch.cause) {
    answer += `⚠️ علت احتمالی:\n${bestMatch.cause}\n\n`;
  }

  if (bestMatch.solution) {
    answer += `✅ راهکار:\n${bestMatch.solution}\n`;
  }

  if (bestMatch.general) {
    answer += `\n${bestMatch.general}\n`;
  }

  return answer;
}

export default findOfflineAnswer;
