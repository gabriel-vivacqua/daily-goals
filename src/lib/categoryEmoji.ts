/** Curated emoji choices shown in the category emoji picker. */
export const CATEGORY_EMOJI_CHOICES = [
  "💪", "🏃", "🧘", "📚", "💼", "💰", "🥗", "💧",
  "😴", "🏠", "👨‍👩‍👧", "🎵", "🎨", "💻", "🗣️", "✈️",
  "🎮", "🐶", "🎯", "🧹", "🧠", "❤️", "🎓", "🌱",
];

const LEADING_EMOJI_RE = new RegExp(
  "^(\\p{Extended_Pictographic}(\\u200d\\p{Extended_Pictographic})*\\ufe0f?\\s*)",
  "u"
);

/** Splits a category string like "💪 Fitness" into its leading emoji and remaining text. */
export function splitCategoryEmoji(category: string): { emoji: string | null; text: string } {
  const match = category.match(LEADING_EMOJI_RE);
  if (!match) return { emoji: null, text: category };
  return { emoji: match[1].trim(), text: category.slice(match[0].length) };
}
