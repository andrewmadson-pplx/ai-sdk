import assert from "node:assert/strict";
import { perplexityAgent } from "./index";

const apiResponse = {
  id: "resp_test",
  model: "openai/gpt-6-luna",
  output: [
    {
      type: "search_results",
      results: [
        { id: 1, title: "Node.js releases", url: "https://nodejs.org/en/about/previous-releases", snippet: "Active LTS: 26", date: "2026-10-28", last_updated: "2026-11-01", source: "web" },
        { id: 2, title: "Node.js 26", url: "https://nodejs.org/en/blog/release/v26.0.0", snippet: "Node.js 26 is out", date: null, last_updated: null, source: "web" },
      ],
    },
    {
      type: "message",
      content: [
        { type: "output_text", text: "Node.js 26 is the active LTS line. " },
        { type: "output_text", text: "[web:1]" },
      ],
    },
  ],
};

export async function testAgent() {
  const originalFetch = globalThis.fetch;
  let requestUrl: unknown;
  let requestBody: unknown;
  let status = 200;

  globalThis.fetch = async (url, init) => {
    requestUrl = url;
    assert.equal(init?.method, "POST");
    requestBody = JSON.parse(String(init?.body));
    return new Response(status === 200 ? JSON.stringify(apiResponse) : "invalid effort", { status });
  };

  try {
    const options = { toolCallId: "test", messages: [] };
    const result = await perplexityAgent({ apiKey: "test-api-key" }).execute!(
      { question: "Which Node.js line is LTS?" },
      options,
    );
    assert.equal(requestUrl, "https://api.perplexity.ai/v1/agent");
    assert.deepEqual(requestBody, { input: "Which Node.js line is LTS?", effort: "low" });
    assert.deepEqual(result, {
      id: "resp_test",
      model: "openai/gpt-6-luna",
      text: "Node.js 26 is the active LTS line. [web:1]",
      sources: [
        { id: 1, title: "Node.js releases", url: "https://nodejs.org/en/about/previous-releases", snippet: "Active LTS: 26", date: "2026-10-28", last_updated: "2026-11-01" },
        { id: 2, title: "Node.js 26", url: "https://nodejs.org/en/blog/release/v26.0.0", snippet: "Node.js 26 is out", date: null, last_updated: null },
      ],
    });

    await perplexityAgent({ apiKey: "test-api-key", effort: "high", model: "anthropic/claude-sonnet-4-6" }).execute!(
      { question: "q" },
      options,
    );
    assert.deepEqual(requestBody, { input: "q", effort: "high", model: "anthropic/claude-sonnet-4-6" });

    status = 400;
    await assert.rejects(
      async () => {
        await perplexityAgent({ apiKey: "test-api-key" }).execute!({ question: "q" }, options);
      },
      /Perplexity Agent API error: 400 - invalid effort/,
    );

    const originalKey = process.env.PERPLEXITY_API_KEY;
    delete process.env.PERPLEXITY_API_KEY;
    try {
      await assert.rejects(
        async () => {
          await perplexityAgent().execute!({ question: "q" }, options);
        },
        /PERPLEXITY_API_KEY is required/,
      );
    } finally {
      if (originalKey) {
        process.env.PERPLEXITY_API_KEY = originalKey;
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  console.log("  Agent tool sends effort and model, and returns the answer text and sources");
}
