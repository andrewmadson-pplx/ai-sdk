export interface PerplexitySearchConfig {
  /**
   * API key for authenticating requests to Perplexity Search API.
   * If not provided, will use PERPLEXITY_API_KEY environment variable.
   */
  apiKey?: string;
}

/**
 * Individual search result from Perplexity Search API
 */
export interface PerplexitySearchResult {
  /**
   * Title of the search result
   */
  title: string;

  /**
   * URL of the search result
   */
  url: string;

  /**
   * Text snippet/preview of the content
   */
  snippet: string;

  /**
   * Publication date of the content
   */
  date?: string | null;

  /**
   * Last updated date of the content
   */
  last_updated?: string | null;
}

/**
 * Response from Perplexity Search API
 */
export interface PerplexitySearchResponse {
  /**
   * Array of search results
   */
  results: PerplexitySearchResult[];

  /**
   * Unique identifier for this search request
   */
  id: string;
}

export interface PerplexityAgentConfig {
  /**
   * API key for authenticating requests to Perplexity Agent API.
   * If not provided, will use PERPLEXITY_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Agent API effort level, such as "low", "medium" or "high". Defaults to "low".
   */
  effort?: string;

  /**
   * Agent API model ID, such as "anthropic/claude-sonnet-4-6".
   * If not provided, the effort level picks the model.
   */
  model?: string;
}

/**
 * Web source the Agent API used for its answer
 */
export interface PerplexityAgentSource extends PerplexitySearchResult {
  /**
   * Source id, referenced in the answer as [web:<id>]
   */
  id: number;
}

/**
 * Response from the perplexityAgent tool
 */
export interface PerplexityAgentResponse {
  /**
   * Unique identifier for this Agent API response
   */
  id: string;

  /**
   * Model that produced the answer
   */
  model: string;

  /**
   * Answer text, with citations like [web:1]
   */
  text: string;

  /**
   * Web sources the answer cites by id
   */
  sources: PerplexityAgentSource[];
}
