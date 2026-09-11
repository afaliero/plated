import OpenAI from "openai";
import { modelForTask } from "src/services/ai/model-policy.js";
import type {
  AiClientContract,
  StructuredAiRequest,
} from "src/services/ai/types.js";

export class OpenAiClient implements AiClientContract {
  private client: OpenAI | null = null;

  constructor(private readonly apiKey: string | undefined) {}

  async createStructured<T>(request: StructuredAiRequest): Promise<T> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    this.client ??= new OpenAI({ apiKey: this.apiKey });

    const response = await this.client.responses.create({
      model: modelForTask(request.task),
      store: false,
      instructions: request.instructions,
      input: JSON.stringify(request.input),
      text: {
        format: {
          type: "json_schema",
          name: request.task,
          strict: true,
          schema: request.schema,
        },
      },
    });

    if (!response.output_text)
      throw new Error("OpenAI returned an empty response.");
    return JSON.parse(response.output_text) as T;
  }
}
