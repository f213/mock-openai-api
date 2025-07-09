// OpenAI API 兼容的类型定义

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: Model[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolCallDelta {
  index?: number;
  id?: string;
  type?: 'function';
  function?: {
    name?: string;
    arguments?: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  functions?: Array<{
    name: string;
    description?: string;
    parameters?: any;
  }>;
  function_call?: string | { name: string };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      reasoning_tokens: number;
    };
  };
}

export interface ChatCompletionStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint?: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string | null;
      reasoning_content?: string | null;
      function_call?: {
        name?: string;
        arguments?: string;
      };
      tool_calls?: ToolCallDelta[];
    };
    logprobs?: null;
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens: number;
    };
    completion_tokens_details?: {
      reasoning_tokens: number;
    };
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  } | null;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  quality?: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
  user?: string;
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

export interface MockTestCase {
  name: string;
  description: string;
  prompt: string;
  response: string;
  reasoning_content?: string;
  streamChunks?: string[];
  reasoning_chunks?: string[];
  functionCall?: {
    name: string;
    arguments: any;
  };
  toolCall?: {
    name: string;
    arguments: any;
    id?: string;
  };
  toolCallResponse?: string;
  toolCallResponseChunks?: string[];
}

export interface MockModel {
  id: string;
  name: string;
  description: string;
  type: 'thinking' | 'markdown' | 'image' | 'thinking-tag' | 'tool-calls' | 'function';
  testCases: MockTestCase[];
} 
