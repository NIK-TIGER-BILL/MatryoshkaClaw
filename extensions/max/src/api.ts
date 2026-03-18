/**
 * Max Bot API client
 * Base URL: https://botapi.max.ru
 * Auth: ?access_token=TOKEN query param
 * Docs: https://dev.max.ru/docs
 */

export const MAX_API_BASE = "https://botapi.max.ru";

export interface MaxBotInfo {
  user_id: number;
  name: string;
  username: string;
  avatar_url?: string;
  is_bot: boolean;
}

export interface MaxChat {
  chat_id: number;
  type: "dialog" | "chat" | "channel";
  title?: string;
  description?: string;
  members_count?: number;
}

export interface MaxUser {
  user_id: number;
  name: string;
  username?: string;
  avatar_url?: string;
  is_bot?: boolean;
}

export interface MaxMessage {
  sender?: MaxUser;
  recipient?: {
    chat_id?: number;
    user_id?: number;
    chat_type?: "dialog" | "chat" | "channel";
  };
  timestamp: number;
  body?: {
    mid: string;
    text?: string;
    attachments?: MaxAttachment[];
  };
  stat?: {
    views?: number;
  };
}

export interface MaxAttachment {
  type: "image" | "video" | "audio" | "file" | "sticker" | "contact" | "location" | "inline_keyboard" | "share";
  payload?: {
    url?: string;
    token?: string;
    file_id?: number;
    title?: string;
    mime_type?: string;
    filename?: string;
    size?: number;
    buttons?: MaxButton[][];
  };
}

export interface MaxButton {
  type: "callback" | "link" | "request_geo_location" | "request_contact" | "chat";
  text: string;
  payload?: string;
  url?: string;
}

export interface MaxUpdate {
  update_type:
    | "message_created"
    | "message_edited"
    | "message_removed"
    | "bot_added"
    | "bot_removed"
    | "user_added"
    | "user_removed"
    | "bot_started"
    | "chat_title_changed"
    | "message_callback";
  timestamp: number;
  message?: MaxMessage;
  callback?: {
    timestamp: number;
    callback_id: string;
    payload?: string;
    user: MaxUser;
    message?: MaxMessage;
  };
  user?: MaxUser;
  chat_id?: number;
  inviter?: MaxUser;
  admin_id?: number;
  is_channel?: boolean;
  message_id?: string;
}

export interface MaxUpdatesResponse {
  updates: MaxUpdate[];
  marker?: number;
}

export interface MaxSendMessagePayload {
  text?: string;
  attachments?: MaxAttachment[];
  link?: {
    type: "forward" | "reply";
    mid: string;
  };
  notify?: boolean;
  format?: "markdown" | "html";
}

export interface MaxSendMessageResponse {
  message: MaxMessage;
}

export class MaxApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, baseUrl = MAX_API_BASE) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}?access_token=${this.token}`;
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    params?: Record<string, string | number | boolean>,
    body?: unknown
  ): Promise<T> {
    let url = this.url(path);

    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      );
      url += `&${qs.toString()}`;
    }

    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Max API error ${res.status}: ${(err as { message?: string }).message ?? res.statusText}`
      );
    }

    return res.json() as Promise<T>;
  }

  /** GET /me — get bot info */
  async getMe(): Promise<MaxBotInfo> {
    return this.request<MaxBotInfo>("GET", "/me");
  }

  /** GET /updates — long polling */
  async getUpdates(params?: {
    limit?: number;
    timeout?: number;
    marker?: number;
    types?: string;
  }): Promise<MaxUpdatesResponse> {
    return this.request<MaxUpdatesResponse>("GET", "/updates", params as Record<string, string | number>);
  }

  /** POST /messages — send message to chat or user */
  async sendMessage(
    target: { chat_id: number } | { user_id: number },
    payload: MaxSendMessagePayload
  ): Promise<MaxSendMessageResponse> {
    const params =
      "chat_id" in target
        ? { chat_id: target.chat_id }
        : { user_id: target.user_id };

    return this.request<MaxSendMessageResponse>(
      "POST",
      "/messages",
      params as Record<string, number>,
      payload
    );
  }

  /** DELETE /messages/{messageId} — delete message */
  async deleteMessage(messageId: string): Promise<void> {
    await this.request("DELETE", `/messages/${messageId}`);
  }

  /** GET /chats — list bot's chats */
  async getChats(params?: { count?: number; marker?: number }): Promise<{ chats: MaxChat[]; marker?: number }> {
    return this.request("GET", "/chats", params as Record<string, number>);
  }

  /** POST /subscriptions — set webhook */
  async setWebhook(url: string): Promise<{ success: boolean }> {
    return this.request("POST", "/subscriptions", undefined, { url });
  }

  /** DELETE /subscriptions — remove webhook (switch to long polling) */
  async deleteWebhook(): Promise<{ success: boolean }> {
    return this.request("DELETE", "/subscriptions");
  }

  /** POST /answers — answer callback query */
  async answerCallback(callbackId: string, payload?: {
    text?: string;
    notification?: string;
  }): Promise<{ success: boolean }> {
    return this.request("POST", "/answers", { callback_id: callbackId }, payload);
  }
}
