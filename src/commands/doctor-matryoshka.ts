/**
 * 🪆 MatryoshkaClaw — Бабушкина диагностика
 *
 * Проверяет ключевые компоненты MatryoshkaClaw с русским характером.
 * Каждая проверка — маленькая история.
 */

import { execSync } from "node:child_process";
import type { OpenClawConfig } from "../config/config.js";
import { note } from "../terminal/note.js";

type CheckResult = {
  status: "ok" | "warn" | "error";
  message: string;
};

// ── Проверки ─────────────────────────────────────────────────────────────────

function checkNodeVersion(): CheckResult {
  const version = process.version; // e.g. "v22.1.0"
  const major = parseInt(version.slice(1).split(".")[0] ?? "0", 10);
  if (major >= 22) {
    return {
      status: "ok",
      message: `Node.js ${version} найден. Бабушка одобряет.`,
    };
  }
  if (major >= 20) {
    return {
      status: "warn",
      message: `Node.js ${version} — работает, но лучше обновиться до v22. Прогресс не стоит на месте.`,
    };
  }
  return {
    status: "error",
    message: `Node.js ${version} — слишком старый. Нужен v22+. Без этого матрёшка не откроется.`,
  };
}

function checkMatryoshkaCommand(): CheckResult {
  try {
    const out = execSync("matryoshka --version 2>/dev/null", { timeout: 3000 })
      .toString()
      .trim()
      .split("\n")[0];
    return {
      status: "ok",
      message: `Команда \`matryoshka\` найдена: ${out}`,
    };
  } catch {
    try {
      execSync("openclaw --version 2>/dev/null", { timeout: 3000 });
      return {
        status: "warn",
        message:
          "Найдена команда \`openclaw\`, но не \`matryoshka\`. Переустановите: npm install -g --force .",
      };
    } catch {
      return {
        status: "error",
        message:
          "Команда \`matryoshka\` не найдена в PATH. Установите: curl -fsSL https://raw.githubusercontent.com/NIK-TIGER-BILL/MatryoshkaClaw/main/install.sh | bash",
      };
    }
  }
}

function checkMaxToken(cfg: OpenClawConfig): CheckResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (cfg as any)?.channels?.max?.botToken?.trim();
  if (token) {
    return {
      status: "ok",
      message: "Токен Max настроен. Суверенный мессенджер готов к работе. 🪆",
    };
  }
  return {
    status: "warn",
    message:
      "Токен Max не настроен. Без бумажки ты букашка. Настрой: matryoshka onboard → Max.",
  };
}

function checkGigaChat(cfg: OpenClawConfig): CheckResult {
  const envCreds = process.env["GIGACHAT_CREDENTIALS"]?.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfgCreds = (cfg as any)?.providers?.gigachat?.apiKey?.trim();

  if (envCreds || cfgCreds) {
    return {
      status: "ok",
      message: "GigaChat настроен. Сбербанк одобряет. (Минцифры тоже, вероятно.)",
    };
  }
  return {
    status: "warn",
    message:
      "GigaChat не настроен. Установите GIGACHAT_CREDENTIALS для использования российского LLM.",
  };
}

function checkTelegramToken(cfg: OpenClawConfig): CheckResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = (cfg as any)?.channels?.telegram?.accounts ?? {};
  const hasToken = Object.values(accounts).some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: any) => typeof acc?.botToken === "string" && acc.botToken.trim().length > 0,
  );
  if (hasToken) {
    return {
      status: "ok",
      message: "Telegram настроен. Дуров бы гордился. (Или нет — не уточняли.)",
    };
  }
  return {
    status: "warn",
    message: "Telegram не настроен. Для настройки: matryoshka onboard → Telegram.",
  };
}

function checkGatewayPort(): CheckResult {
  try {
    execSync("curl -sf http://127.0.0.1:19789/ -o /dev/null 2>/dev/null", { timeout: 2000 });
    return {
      status: "ok",
      message: "Шлюз запущен на порту 19789. Очередь принимает заявки.",
    };
  } catch {
    return {
      status: "warn",
      message: "Шлюз не отвечает. Запустите: matryoshka gateway start",
    };
  }
}

// ── Форматирование ────────────────────────────────────────────────────────────

function icon(status: CheckResult["status"]): string {
  return status === "ok" ? "✅" : status === "warn" ? "⚠️ " : "❌";
}

// ── Основная функция ──────────────────────────────────────────────────────────

export function noteMatryoshkaHealth(cfg: OpenClawConfig): void {
  const checks: CheckResult[] = [
    checkNodeVersion(),
    checkMatryoshkaCommand(),
    checkMaxToken(cfg),
    checkGigaChat(cfg),
    checkTelegramToken(cfg),
    checkGatewayPort(),
  ];

  const lines = checks.map((c) => `${icon(c.status)} ${c.message}`);

  const hasError = checks.some((c) => c.status === "error");
  const hasWarn = checks.some((c) => c.status === "warn");

  const summary = hasError
    ? "\nМатрёшка тревожится. Исправьте ошибки выше и запустите matryoshka doctor снова."
    : hasWarn
      ? "\nМатрёшка почти довольна. Рекомендации выше — по желанию."
      : "\nВсё работает. Бабушка довольна. 🪆";

  lines.push("", summary);

  note(lines.join("\n"), "🪆 Матрёшкина диагностика");
}
