export type KbSection = {
  path: string;
  text: string;
};

const QUERY_SYNONYMS: string[][] = [
  ["загреб", "zagreb"],
  ["адрес", "address", "registration", "регистрац"],
  ["digital", "nomad", "номад", "цифров"],
  ["хорват", "croatia", "croat", "hr_"],
  ["испан", "spain"],
  ["внж", "вид", "residence", "residency"],
  ["закон", "закона", "законе", "zakon", "stranc", "strancima", "иностран", "foreigner", "foreigners"],
  ["положен", "положения", "aktualna", "izmjene", "izmen"],
  ["news", "updates", "новост", "news_and_updates"],
];

const MAX_SECTION_CHARS = 24_000;

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    for (const group of QUERY_SYNONYMS) {
      const matches = group.some(
        (word) =>
          token.includes(word) ||
          word.includes(token) ||
          (token.length >= 4 && word.startsWith(token.slice(0, 4))) ||
          (word.length >= 4 && token.startsWith(word.slice(0, 4))),
      );
      if (matches) {
        for (const word of group) {
          expanded.add(word);
        }
      }
    }
  }

  return [...expanded];
}

export function tokenizeQuery(query: string): string[] {
  const base = query
    .toLowerCase()
    .split(/[^a-zа-яё0-9_]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  return expandTokens(base);
}

function scoreSection(section: KbSection, tokens: string[]): number {
  const pathLower = section.path.toLowerCase();
  const textLower = section.text.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (pathLower.includes(token)) {
      score += 14;
    }
    if (textLower.includes(token)) {
      score += 5;
    }
  }

  if (
    tokens.some((token) => ["закон", "zakon", "stranc", "иностран"].includes(token)) &&
    (pathLower.includes("news_and_updates") ||
      pathLower.includes("zakon") ||
      pathLower.includes("strancima"))
  ) {
    score += 20;
  }

  return score;
}

function trimSectionText(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}\n\n[…фрагмент документа обрезан]`;
}

export function selectKbSectionsForQuery(
  sections: KbSection[],
  query: string,
  maxChars: number,
): string {
  if (sections.length === 0) {
    return "База знаний пуста или документы не удалось прочитать.";
  }

  const tokens = tokenizeQuery(query);
  const scored = sections
    .map((section) => ({
      section,
      score: scoreSection(section, tokens),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.section.path.localeCompare(right.section.path, "ru");
    });

  const relevant = scored.filter((item) => item.score > 0);
  const pool = relevant.length > 0 ? relevant : scored;

  const selected: KbSection[] = [];
  let chars = 0;

  for (const { section, score } of pool) {
    const sectionLimit = score >= 20 ? MAX_SECTION_CHARS : 10_000;
    const trimmedText = trimSectionText(section.text, sectionLimit);
    const block = `### ${section.path}\n${trimmedText}`;

    if (chars > 0 && chars + block.length + 2 > maxChars) {
      if (selected.length === 0) {
        selected.push({ path: section.path, text: trimSectionText(section.text, maxChars - section.path.length - 10) });
      }
      break;
    }

    selected.push({ path: section.path, text: trimmedText });
    chars += block.length + 2;
  }

  if (selected.length === 0) {
    const fallback = sections
      .slice()
      .sort((left, right) => left.path.localeCompare(right.path, "ru"))[0];
    return `### ${fallback.path}\n${trimSectionText(fallback.text, maxChars)}`;
  }

  return selected.map((section) => `### ${section.path}\n${section.text}`).join("\n\n");
}
