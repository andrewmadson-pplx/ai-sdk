import { tool } from "ai";
import { z } from "zod";
import packageJson from "../../package.json";
import type { PerplexityAgentConfig, PerplexityAgentResponse, PerplexityAgentSource } from "../types";

interface AgentApiResponse {
  id: string;
  model: string;
  output: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
    results?: PerplexityAgentSource[];
  }>;
}

export function perplexityAgent(config: PerplexityAgentConfig = {}) {
  const {
    apiKey = process.env.PERPLEXITY_API_KEY,
    effort = "low",
    model,
  } = config;

  return tool({
    description: "Answer a question with Perplexity's Agent API, which searches the web and returns a cited answer. Use it for questions that need current information or a synthesis across sources. Citations in the answer look like [web:1] and refer to the source with that id.",
    inputSchema: z.object({
      question: z.string().min(1).describe("The question to answer, with any context the answer needs."),
    }),
    execute: async ({ question }): Promise<PerplexityAgentResponse> => {
      if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY is required. Set it in environment variables or pass it in config.");
      }

      const requestBody: Record<string, unknown> = { input: question, effort };
      if (model !== undefined) {
        requestBody.model = model;
      }

      try {
        const response = await fetch('https://api.perplexity.ai/v1/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Pplx-Integration': `perplexity-ai-sdk/${packageJson.version}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Perplexity Agent API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as AgentApiResponse;
        const text = data.output
          .filter((item) => item.type === "message")
          .flatMap((item) => item.content ?? [])
          .filter((part) => part.type === "output_text")
          .map((part) => part.text ?? "")
          .join("");
        const sources = data.output
          .filter((item) => item.type === "search_results")
          .flatMap((item) => item.results ?? [])
          .map(({ id, title, url, snippet, date, last_updated }) => ({ id, title, url, snippet, date, last_updated }));

        return { id: data.id, model: data.model, text, sources };
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to answer with Perplexity Agent API: ${error.message}`);
        }
        throw error;
      }
    },
  });
}
