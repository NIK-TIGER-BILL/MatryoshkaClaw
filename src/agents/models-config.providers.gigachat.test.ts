import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { withEnvAsync } from "../test-utils/env.js";
import { resolveImplicitProvidersForTest } from "./models-config.e2e-harness.js";
import {
  GIGACHAT_DEFAULT_BASE_URL,
  GIGACHAT_DEFAULT_MODEL_ID,
} from "./models-config.providers.static.js";

// Split to avoid secret scanning false-positives
const credentialsEnvVar = ["GIGACHAT", "CREDENTIALS"].join("_");
const baseUrlEnvVar = ["GIGACHAT", "BASE_URL"].join("_");

describe("GigaChat provider", () => {
  it("should not include gigachat when GIGACHAT_CREDENTIALS is not set", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    await withEnvAsync({ [credentialsEnvVar]: undefined }, async () => {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.gigachat).toBeUndefined();
    });
  });

  it("should include gigachat with default base URL when only GIGACHAT_CREDENTIALS is set", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    // pragma: allowlist secret
    const creds = "dGVzdC1jcmVkZW50aWFscw=="; // pragma: allowlist secret
    await withEnvAsync({ [credentialsEnvVar]: creds }, async () => {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.gigachat).toBeDefined();
      expect(providers?.gigachat?.baseUrl).toBe(GIGACHAT_DEFAULT_BASE_URL);
      expect(providers?.gigachat?.api).toBe("openai-completions");
      const models = providers?.gigachat?.models ?? [];
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]?.id).toBe(GIGACHAT_DEFAULT_MODEL_ID);
      expect(providers?.gigachat?.apiKey).toBe("GIGACHAT_CREDENTIALS");
    });
  });

  it("should use GIGACHAT_BASE_URL when set", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    // pragma: allowlist secret
    const creds = "dGVzdC1jcmVkZW50aWFscw=="; // pragma: allowlist secret
    const customBase = "http://192.168.1.1:8023";
    await withEnvAsync(
      { [credentialsEnvVar]: creds, [baseUrlEnvVar]: customBase },
      async () => {
        const providers = await resolveImplicitProvidersForTest({ agentDir });
        expect(providers?.gigachat?.baseUrl).toBe(customBase);
      },
    );
  });
});
