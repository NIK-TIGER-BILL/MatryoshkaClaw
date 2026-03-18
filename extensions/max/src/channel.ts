/**
 * Max messenger channel plugin for MatryoshkaClaw
 *
 * Implements the same ChannelPlugin interface as the Telegram extension,
 * allowing MatryoshkaClaw to receive and send messages via the Max Bot API.
 *
 * Max Bot API docs: https://dev.max.ru/docs
 * Base URL: https://botapi.max.ru
 * Auth: ?access_token=<TOKEN>
 *
 * Create a bot: open @MasterBot in Max (max.ru/MasterBot)
 */

import { MaxApiClient } from "./api.js";
import { MaxPoller } from "./polling.js";
import { chunkText } from "./format.js";
import type { MaxUpdate, MaxUser, MaxSendMessagePayload } from "./api.js";

// ─── Config ──────────────────────────────────────────────────────────────────

export interface MaxChannelConfig {
  /** Bot token obtained from @MasterBot */
  botToken: string;
  /** DM policy (default: pairing) */
  dmPolicy?: "allow" | "pairing" | "deny";
  /** Port for webhook mode; if omitted, uses long polling */
  webhookPort?: number;
  /** Webhook path (default: /max-webhook) */
  webhookPath?: string;
}

// ─── Inbound message normalisation ───────────────────────────────────────────

export interface NormalisedMaxMessage {
  /** "max:<chat_id>" or "max:user:<user_id>" */
  sessionKey: string;
  senderId: string;
  senderName: string;
  text: string;
  messageId: string;
  timestamp: number;
  isGroup: boolean;
  chatId?: number;
  userId?: number;
}

function normaliseSender(user?: MaxUser): { id: string; name: string } {
  if (!user) return { id: "unknown", name: "Unknown" };
  return {
    id: String(user.user_id),
    name: user.name ?? user.username ?? String(user.user_id),
  };
}

function normaliseUpdate(update: MaxUpdate): NormalisedMaxMessage | null {
  if (update.update_type !== "message_created" || !update.message) return null;

  const msg = update.message;
  const text = msg.body?.text?.trim() ?? "";
  const mid = msg.body?.mid ?? "";
  const sender = normaliseSender(msg.sender);

  const chatId = msg.recipient?.chat_id;
  const userId = msg.recipient?.user_id ?? msg.sender?.user_id;
  const isGroup = msg.recipient?.chat_type === "chat" || msg.recipient?.chat_type === "channel";

  const sessionKey = isGroup && chatId
    ? `max:${chatId}`
    : `max:user:${userId}`;

  return {
    sessionKey,
    senderId: sender.id,
    senderName: sender.name,
    text,
    messageId: mid,
    timestamp: msg.timestamp,
    isGroup,
    chatId,
    userId,
  };
}

// ─── Channel plugin ───────────────────────────────────────────────────────────

export class MaxChannel {
  private client: MaxApiClient;
  private poller: MaxPoller | null = null;
  private config: MaxChannelConfig;
  private botInfo: { user_id: number; name: string; username: string } | null = null;

  constructor(config: MaxChannelConfig) {
    this.config = config;
    this.client = new MaxApiClient(config.botToken);
  }

  /** Verify token and fetch bot metadata */
  async probe(): Promise<{ ok: true; botName: string } | { ok: false; error: string }> {
    try {
      const me = await this.client.getMe();
      this.botInfo = me;
      return { ok: true, botName: me.name };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  /** Start receiving messages via long polling */
  startPolling(onMessage: (msg: NormalisedMaxMessage) => Promise<void>): void {
    if (this.poller) return;

    this.poller = new MaxPoller(
      this.client,
      async (update) => {
        const msg = normaliseUpdate(update);
        if (msg && msg.text) {
          await onMessage(msg);
        }
      },
      { timeout: 30, limit: 100 }
    );

    this.poller.start();
    console.log("[Max] Long polling started");
  }

  /** Stop polling */
  stopPolling(): void {
    this.poller?.stop();
    this.poller = null;
  }

  /**
   * Send a text message to a chat or user.
   * Automatically splits messages exceeding 4000 chars.
   */
  async sendText(
    target: { chatId: number } | { userId: number },
    text: string,
    opts?: { format?: "markdown" | "html"; notify?: boolean }
  ): Promise<void> {
    const chunks = chunkText(text);
    const apiTarget =
      "chatId" in target
        ? { chat_id: target.chatId }
        : { user_id: target.userId };

    for (const chunk of chunks) {
      const payload: MaxSendMessagePayload = {
        text: chunk,
        format: opts?.format,
        notify: opts?.notify,
      };
      await this.client.sendMessage(apiTarget, payload);
    }
  }

  /**
   * Send a message with inline keyboard buttons.
   */
  async sendWithButtons(
    target: { chatId: number } | { userId: number },
    text: string,
    buttons: Array<Array<{ text: string; payload: string }>>
  ): Promise<void> {
    const apiTarget =
      "chatId" in target
        ? { chat_id: target.chatId }
        : { user_id: target.userId };

    const payload: MaxSendMessagePayload = {
      text,
      attachments: [
        {
          type: "inline_keyboard",
          payload: {
            buttons: buttons.map((row) =>
              row.map((btn) => ({
                type: "callback" as const,
                text: btn.text,
                payload: btn.payload,
              }))
            ),
          },
        },
      ],
    };

    await this.client.sendMessage(apiTarget, payload);
  }

  /** Get current bot info (requires probe() to have been called) */
  getBotInfo() {
    return this.botInfo;
  }

  /** Low-level API client access */
  getApiClient(): MaxApiClient {
    return this.client;
  }
}

// ─── Plugin factory ───────────────────────────────────────────────────────────

export function createMaxChannel(config: MaxChannelConfig): MaxChannel {
  return new MaxChannel(config);
}
