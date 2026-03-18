/**
 * MatryoshkaClaw — Max messenger channel plugin 🪆
 *
 * Интеграция с мессенджером Max (VK) для MatryoshkaClaw.
 * Первая в мире открытая интеграция AI-агента с Max Bot API.
 *
 * Настройка:
 *  1. Откройте @MasterBot в Max: https://max.ru/MasterBot
 *  2. Создайте бота, получите токен
 *  3. Добавьте в конфиг:
 *     {
 *       "channels": {
 *         "max": {
 *           "enabled": true,
 *           "botToken": "ваш-токен"
 *         }
 *       }
 *     }
 *  4. Запустите: matryoshka gateway start
 *
 * API: https://dev.max.ru/docs
 */

// ── Публичный API плагина ────────────────────────────────────────────────────
export { MaxChannel, createMaxChannel } from "./src/channel.js";
export { MaxApiClient } from "./src/api.js";
export { MaxPoller } from "./src/polling.js";
export { chunkText, escapeMaxMarkdown, buildInlineKeyboard } from "./src/format.js";
export type { MaxChannelConfig, NormalisedMaxMessage } from "./src/channel.js";
export type {
  MaxBotInfo,
  MaxChat,
  MaxUser,
  MaxMessage,
  MaxUpdate,
  MaxAttachment,
  MaxButton,
  MaxSendMessagePayload,
} from "./src/api.js";

// ── Заглушка плагина (openclaw plugin registry) ──────────────────────────────
// Полная интеграция ChannelPlugin требует регистрации в openclaw plugin-sdk.
// На текущем этапе плагин предоставляет standalone API для использования в коде.
// TODO: реализовать полноценный ChannelPlugin с api.registerChannel()

const maxPlugin = {
  id: "max",
  name: "Max (VK)",
  description: "Российский мессенджер Max (VK) — суверенная интеграция 🪆",
  configSchema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      enabled: { type: "boolean" as const },
      botToken: { type: "string" as const },
      dmPolicy: { type: "string" as const, enum: ["allow", "pairing", "deny"] },
    },
  },
  register(_api: unknown) {
    // Standalone-режим: плагин регистрирует только метаданные.
    // Для получения сообщений используйте createMaxChannel() напрямую.
    console.info("[MatryoshkaClaw] Max plugin loaded. Use createMaxChannel() to start bot.");
  },
};

export default maxPlugin;
