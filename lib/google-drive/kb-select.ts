export type KbSection = {
  path: string;
  text: string;
};

const QUERY_SYNONYMS: Record<string, string[]> = {
  zagreb: ["загреб", "zagreb"],
  адрес: ["адрес", "address", "registration", "регистрац"],
  digital: ["digital", "nomad", "номад", "цифров"],
  хорват: ["хорват", "croatia", "croat"],
  испан: ["испан", "spain"],
  внж: ["внж", "вид", "residence", "residency"],
};

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    for (const group of Object.values(QUERY_SYNONYMS)) {
      if (group.some((word) => word.includes(token) || token.includes(word))) {
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
    .split(/[^a-zа-яё0-9]+/i)
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
      score += 12;
    }
    if (textLower.includes(token)) {
      score += 4;
    }
  }

  return score;
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

  const selected: KbSection[] = [];
  let chars = 0;

  const relevant = scored.filter((item) => item.score > 0);
  const pool = relevant.length > 0 ? relevant : scored;

  for (const { section } of pool) {
    const block = `### ${section.path}\n${section.text}`;
    if (chars > 0 && chars + block.length + 2 > maxChars) {
      break;
    }
    selected.push(section);
    chars += block.length + 2;
  }

  if (selected.length === 0) {
    const fallback = sections
      .slice()
      .sort((left, right) => left.path.localeCompare(right.path, "ru"))[0];
    return `### ${fallback.path}\n${fallback.text}`;
  }

  return selected.map((section) => `### ${section.path}\n${section.text}`).join("\n\n");
}
