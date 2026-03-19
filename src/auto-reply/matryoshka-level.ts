/**
 * 🪆 MatryoshkaClaw — Система уровней агента
 *
 * Геймификация: агент набирает XP с каждым токеном.
 * Уровень отображается в /status.
 *
 * XP = суммарные токены / 100 (100 токенов = 1 XP).
 * XP сохраняется глобально в ~/.openclaw/state/matryoshka-xp.json.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ── Уровни ────────────────────────────────────────────────────────────────────

export type MatryoshkaLevel = {
  num: number;
  name: string;
  emoji: string;
  minXp: number;
  nextXp: number | null;
};

export const MATRYOSHKA_LEVELS: MatryoshkaLevel[] = [
  { num: 1, name: "Семечко",            emoji: "🌱",                 minXp: 0,     nextXp: 100   },
  { num: 2, name: "Малая Матрёшка",     emoji: "🪆",                 minXp: 100,   nextXp: 500   },
  { num: 3, name: "Средняя Матрёшка",   emoji: "🪆🪆",               minXp: 500,   nextXp: 1500  },
  { num: 4, name: "Большая Матрёшка",   emoji: "🪆🪆🪆",             minXp: 1500,  nextXp: 4000  },
  { num: 5, name: "Расписная",          emoji: "🪆🪆🪆🪆",           minXp: 4000,  nextXp: 10000 },
  { num: 6, name: "Мастер",             emoji: "🪆🪆🪆🪆🪆",         minXp: 10000, nextXp: 25000 },
  { num: 7, name: "Бабушкина Гордость", emoji: "🪆🪆🪆🪆🪆🪆🪆",     minXp: 25000, nextXp: null  },
];

// ── Хранилище XP ──────────────────────────────────────────────────────────────

const STATE_FILE = path.join(os.homedir(), ".openclaw", "state", "matryoshka-xp.json");

type XpState = { xp: number; updatedAt: string };

function readXpState(): number {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const data: XpState = JSON.parse(raw);
    return typeof data.xp === "number" && data.xp >= 0 ? data.xp : 0;
  } catch {
    return 0;
  }
}

function saveXpState(xp: number): void {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ xp, updatedAt: new Date().toISOString() } satisfies XpState),
      "utf-8",
    );
  } catch {
    // Не критично — продолжаем без сохранения.
  }
}

// ── Логика уровней ────────────────────────────────────────────────────────────

/** Конвертирует токены в XP: каждые 100 токенов = 1 XP. */
export function tokensToXp(tokens: number): number {
  return Math.floor(Math.max(0, tokens) / 100);
}

/** Находит уровень по количеству XP. */
export function resolveLevel(xp: number): MatryoshkaLevel {
  for (let i = MATRYOSHKA_LEVELS.length - 1; i >= 0; i--) {
    const level = MATRYOSHKA_LEVELS[i];
    if (level && xp >= level.minXp) {
      return level;
    }
  }
  return MATRYOSHKA_LEVELS[0]!;
}

// Простой кеш чтобы не читать файл на каждый /status
let _cachedXp: number | null = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 5_000;

function getCachedXp(): number {
  const now = Date.now();
  if (_cachedXp === null || now - _cacheTs > CACHE_TTL_MS) {
    _cachedXp = readXpState();
    _cacheTs = now;
  }
  return _cachedXp;
}

// ── Публичный API ─────────────────────────────────────────────────────────────

/**
 * Возвращает строку уровня для вставки в /status.
 * Побочный эффект: обновляет XP если сессионных токенов стало больше.
 *
 * @param sessionTokens — суммарные токены текущей сессии
 */
export function resolveMatryoshkaLevelLine(sessionTokens: number): string | null {
  const sessionXp = tokensToXp(sessionTokens);
  const storedXp = getCachedXp();
  const totalXp = Math.max(storedXp, storedXp + sessionXp);

  // Обновляем сохранённый XP если выросло (monotonic)
  if (totalXp > storedXp) {
    _cachedXp = totalXp;
    _cacheTs = Date.now();
    saveXpState(totalXp);
  }

  const level = resolveLevel(totalXp);
  const toNext = level.nextXp !== null ? level.nextXp - totalXp : null;

  const progressPart =
    toNext !== null
      ? ` · До Ур.${level.num + 1}: ${toNext} XP`
      : " · Максимальный уровень! 🎉";

  return `${level.emoji} Ур.${level.num} — ${level.name}${progressPart}`;
}

/** Добавляет XP вручную (например, из `matryoshka babushka`). */
export function addMatryoshkaXp(amount: number): MatryoshkaLevel {
  const stored = getCachedXp();
  const newXp = stored + Math.max(0, amount);
  _cachedXp = newXp;
  _cacheTs = Date.now();
  saveXpState(newXp);
  return resolveLevel(newXp);
}
