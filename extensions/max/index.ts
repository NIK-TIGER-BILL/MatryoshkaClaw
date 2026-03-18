/**
 * MatryoshkaClaw — Max messenger channel plugin 🪆
 *
 * Integrates Max (VK's sovereign messenger) as a channel in MatryoshkaClaw.
 * This is the first open-source AI agent integration with Max Bot API.
 *
 * Setup:
 *  1. Open @MasterBot in Max: https://max.ru/MasterBot
 *  2. Create a bot, get the token
 *  3. Configure in openclaw.json:
 *     {
 *       "channels": {
 *         "max": {
 *           "enabled": true,
 *           "botToken": "your-token-here",
 *           "dmPolicy": "pairing"
 *         }
 *       }
 *     }
 *  4. Start the gateway: matryoshka gateway start
 *
 * API reference: https://dev.max.ru/docs
 * Bot API base:  https://botapi.max.ru
 */

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
