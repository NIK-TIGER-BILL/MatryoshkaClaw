/**
 * MatryoshkaClaw — Max messenger onboarding adapter 🪆
 *
 * Проводит пользователя через настройку бота в мессенджере Max (VK).
 * Создай бота: https://max.ru/MasterBot
 */

import type { OpenClawConfig } from "../../../config/config.js";
import { formatCliCommand } from "../../../cli/command-format.js";
import type { WizardPrompter } from "../../../wizard/prompts.js";
import type {
  ChannelOnboardingAdapter,
  ChannelOnboardingStatus,
  ChannelOnboardingStatusContext,
} from "../onboarding-types.js";
import {
  patchChannelConfigForAccount,
  setChannelDmPolicyWithAllowFrom,
  setOnboardingChannelEnabled,
} from "./helpers.js";

const channel = "max" as const;
const DEFAULT_ACCOUNT_ID = "default";
const MAX_API_BASE = "https://botapi.max.ru";

// ── Утилиты ──────────────────────────────────────────────────────────────────

function resolveMaxToken(cfg: OpenClawConfig): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (cfg as any)?.channels?.max?.botToken?.trim() || undefined;
}

function setMaxToken(cfg: OpenClawConfig, token: string): OpenClawConfig {
  return patchChannelConfigForAccount({
    cfg,
    channel,
    accountId: DEFAULT_ACCOUNT_ID,
    patch: { botToken: token },
  });
}

async function probeMaxToken(token: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const res = await fetch(`${MAX_API_BASE}/me?access_token=${token}`);
    const data = (await res.json()) as { user_id?: number; name?: string; code?: string; message?: string };
    if (res.ok && data.user_id) {
      return { ok: true, name: data.name ?? `Bot #${data.user_id}` };
    }
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Инструкции ───────────────────────────────────────────────────────────────

async function noteMaxTokenHelp(prompter: WizardPrompter): Promise<void> {
  await prompter.note(
    [
      "Как получить токен бота Max:",
      "",
      "1) Откройте мессенджер Max на телефоне или в браузере",
      "2) Найдите бота @MasterBot или откройте: https://max.ru/MasterBot",
      "3) Нажмите «Создать бота» и следуйте инструкциям",
      "4) Скопируйте токен — он выглядит как длинная строка букв и цифр",
      "",
      "Docs: https://dev.max.ru/docs",
    ].join("\n"),
    "Токен бота Max",
  );
}

// ── Onboarding adapter ───────────────────────────────────────────────────────

async function runMaxOnboarding(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
  accountId?: string;
}): Promise<{ cfg: OpenClawConfig; accountId?: string }> {
  const { prompter } = params;
  let cfg = params.cfg;

  const existingToken = resolveMaxToken(cfg);

  await noteMaxTokenHelp(prompter);

  // Ввод токена
  const tokenInput = await prompter.text({
    message: existingToken
      ? "Токен бота Max (оставьте пустым, чтобы сохранить текущий)"
      : "Вставьте токен бота Max",
    placeholder: "ваш-токен-здесь",
  });

  const token = (tokenInput ?? "").trim() || existingToken;

  if (!token) {
    await prompter.note("Токен не указан. Пропускаем настройку Max.", "Max");
    return { cfg };
  }

  // Проверяем токен
  await prompter.note("Проверяем токен...", "Max");
  const probe = await probeMaxToken(token);

  if (probe.ok) {
    await prompter.note(
      `✅ Подключено! Бот: ${probe.name}\n\nMax готов к работе.`,
      "Max — успешно",
    );
  } else {
    await prompter.note(
      `⚠️ Не удалось проверить токен: ${probe.error}\n\nТокен сохранён — проверьте его и перезапустите шлюз.`,
      "Max — предупреждение",
    );
  }

  cfg = setMaxToken(cfg, token);
  cfg = setOnboardingChannelEnabled(cfg, channel, DEFAULT_ACCOUNT_ID, true);

  // Политика DM
  cfg = await setChannelDmPolicyWithAllowFrom({
    cfg,
    prompter,
    channel,
    accountId: DEFAULT_ACCOUNT_ID,
    existingAllowFrom: [],
    skipDmPolicyPrompt: false,
  });

  return { cfg, accountId: DEFAULT_ACCOUNT_ID };
}

async function getMaxOnboardingStatus(
  ctx: ChannelOnboardingStatusContext,
): Promise<ChannelOnboardingStatus> {
  const token = resolveMaxToken(ctx.cfg);
  const configured = Boolean(token);

  const statusLines: string[] = configured
    ? ["✅ Токен настроен", "Запустите шлюз: matryoshka gateway start"]
    : [
        "Токен не настроен",
        `Создайте бота: https://max.ru/MasterBot`,
        `Затем: ${formatCliCommand("matryoshka onboard")}`,
      ];

  return {
    channel,
    configured,
    statusLines,
    selectionHint: configured ? "настроен" : undefined,
    quickstartScore: configured ? 90 : 0,
  };
}

export const maxOnboardingAdapter: ChannelOnboardingAdapter = {
  channel,
  dmPolicy: {
    default: "pairing",
    options: ["allow", "pairing", "deny"],
  },
  run: runMaxOnboarding,
  status: getMaxOnboardingStatus,
};
