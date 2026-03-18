/**
 * MatryoshkaClaw — Max messenger onboarding adapter 🪆
 *
 * Настройка бота в мессенджере Max (VK).
 * Создай бота: https://max.ru/MasterBot
 */

import type { OpenClawConfig } from "../../../config/config.js";
import type { DmPolicy } from "../../../config/types.js";
import type {
  ChannelOnboardingAdapter,
  ChannelOnboardingConfigureContext,
  ChannelOnboardingDmPolicy,
  ChannelOnboardingResult,
  ChannelOnboardingStatus,
  ChannelOnboardingStatusContext,
} from "../onboarding-types.js";

const channel = "max" as const;
const MAX_API_BASE = "https://botapi.max.ru";

// ── Config helpers ────────────────────────────────────────────────────────────

function getMaxToken(cfg: OpenClawConfig): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (cfg as any)?.channels?.max?.botToken?.trim() || undefined;
}

function setMaxToken(cfg: OpenClawConfig, token: string): OpenClawConfig {
  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      max: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(cfg as any)?.channels?.max,
        botToken: token,
        enabled: true,
      },
    },
  } as OpenClawConfig;
}

function getMaxDmPolicy(cfg: OpenClawConfig): DmPolicy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((cfg as any)?.channels?.max?.dmPolicy as DmPolicy) ?? "pairing";
}

function setMaxDmPolicy(cfg: OpenClawConfig, policy: DmPolicy): OpenClawConfig {
  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      max: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(cfg as any)?.channels?.max,
        dmPolicy: policy,
      },
    },
  } as OpenClawConfig;
}

// ── Token probe ───────────────────────────────────────────────────────────────

async function probeMaxToken(
  token: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${MAX_API_BASE}/me?access_token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as {
      user_id?: number;
      name?: string;
      code?: string;
      message?: string;
    };
    if (res.ok && data.user_id) {
      return { ok: true, name: data.name ?? `Bot #${data.user_id}` };
    }
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Onboarding configure ──────────────────────────────────────────────────────

async function configure(ctx: ChannelOnboardingConfigureContext): Promise<ChannelOnboardingResult> {
  const { prompter } = ctx;
  let cfg = ctx.cfg;

  const existingToken = getMaxToken(cfg);

  // Инструкции
  await prompter.note(
    [
      "Как получить токен бота Max:",
      "",
      "1) Откройте мессенджер Max на телефоне или в браузере",
      "2) Найдите @MasterBot или откройте: https://max.ru/MasterBot",
      "3) Нажмите «Создать бота» и следуйте инструкциям",
      "4) Скопируйте токен — длинная строка букв и цифр",
      "",
      "Документация: https://dev.max.ru/docs",
    ].join("\n"),
    "Токен бота Max 🪆",
  );

  // Запрос токена
  const tokenInput = await prompter.text({
    message: existingToken
      ? "Токен бота Max (оставьте пустым, чтобы сохранить текущий)"
      : "Вставьте токен бота Max",
    placeholder: "ваш-токен-от-MasterBot",
  });

  const token = (tokenInput ?? "").trim() || existingToken;

  if (!token) {
    await prompter.note("Токен не указан. Настройка Max пропущена.", "Max");
    return { cfg };
  }

  // Проверка токена
  const probe = await probeMaxToken(token);

  if (probe.ok) {
    await prompter.note(
      `✅ Подключено успешно!\nБот: ${probe.name}\n\nMax готов к работе. Запустите: matryoshka gateway start`,
      "Max — готово",
    );
  } else {
    await prompter.note(
      `⚠️ Не удалось проверить токен: ${probe.error}\n\nТокен сохранён. Проверьте его и перезапустите шлюз.`,
      "Max — предупреждение",
    );
  }

  cfg = setMaxToken(cfg, token);
  return { cfg, accountId: "default" };
}

// ── Status ────────────────────────────────────────────────────────────────────

async function getStatus(ctx: ChannelOnboardingStatusContext): Promise<ChannelOnboardingStatus> {
  const token = getMaxToken(ctx.cfg);
  const configured = Boolean(token);

  return {
    channel,
    configured,
    statusLines: configured
      ? ["✅ Токен настроен", "Запустите: matryoshka gateway start"]
      : ["Токен не настроен", "Создайте бота: https://max.ru/MasterBot"],
    selectionHint: configured ? "настроен" : undefined,
    quickstartScore: configured ? 90 : 0,
  };
}

// ── DM policy ─────────────────────────────────────────────────────────────────

const dmPolicy: ChannelOnboardingDmPolicy = {
  label: "Max DM политика",
  channel,
  policyKey: "channels.max.dmPolicy",
  allowFromKey: "channels.max.allowFrom",
  getCurrent: getMaxDmPolicy,
  setPolicy: setMaxDmPolicy,
};

// ── Adapter export ────────────────────────────────────────────────────────────

export const maxOnboardingAdapter: ChannelOnboardingAdapter = {
  channel,
  getStatus,
  configure,
  dmPolicy,
  disable: (cfg: OpenClawConfig): OpenClawConfig =>
    ({
      ...cfg,
      channels: {
        ...cfg.channels,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        max: { ...(cfg as any)?.channels?.max, enabled: false },
      },
    }) as OpenClawConfig,
};
