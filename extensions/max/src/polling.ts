/**
 * Long polling loop for Max Bot API
 * Mirrors the Telegram polling approach used in MatryoshkaClaw
 */

import type { MaxApiClient, MaxUpdate } from "./api.js";

export type UpdateHandler = (update: MaxUpdate) => Promise<void>;

export interface PollingOptions {
  /** Long poll timeout in seconds (default: 30) */
  timeout?: number;
  /** Max updates per request (default: 100) */
  limit?: number;
  /** Filter by update types */
  types?: string;
  /** Delay between retries on error (ms) */
  retryDelayMs?: number;
}

export class MaxPoller {
  private running = false;
  private marker: number | undefined;
  private readonly client: MaxApiClient;
  private readonly handler: UpdateHandler;
  private readonly opts: Required<PollingOptions>;

  constructor(client: MaxApiClient, handler: UpdateHandler, opts: PollingOptions = {}) {
    this.client = client;
    this.handler = handler;
    this.opts = {
      timeout: opts.timeout ?? 30,
      limit: opts.limit ?? 100,
      types: opts.types ?? "",
      retryDelayMs: opts.retryDelayMs ?? 5000,
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        const params: Record<string, number | string> = {
          limit: this.opts.limit,
          timeout: this.opts.timeout,
        };
        if (this.marker !== undefined) params.marker = this.marker;
        if (this.opts.types) params.types = this.opts.types;

        const resp = await this.client.getUpdates(params as Parameters<MaxApiClient["getUpdates"]>[0]);

        if (resp.marker !== undefined) {
          this.marker = resp.marker;
        }

        for (const update of resp.updates ?? []) {
          try {
            await this.handler(update);
          } catch (err) {
            console.error("[Max] Update handler error:", err);
          }
        }
      } catch (err) {
        if (!this.running) break;
        console.error(`[Max] Polling error, retrying in ${this.opts.retryDelayMs}ms:`, err);
        await new Promise((r) => setTimeout(r, this.opts.retryDelayMs));
      }
    }
  }
}
