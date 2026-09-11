export type AiTask = "recipe-preference-ranking";

export type StructuredAiRequest = {
  task: AiTask;
  instructions: string;
  input: unknown;
  schema: Record<string, unknown>;
};

export interface AiClientContract {
  createStructured<T>(request: StructuredAiRequest): Promise<T>;
}
