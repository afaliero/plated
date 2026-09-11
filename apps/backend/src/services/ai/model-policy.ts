import type { AiTask } from "./types.js";

export const AI_MODEL_POLICY: Record<AiTask, string> = {
  "recipe-preference-ranking": "gpt-5.6-luna",
};

export function modelForTask(task: AiTask): string {
  return AI_MODEL_POLICY[task];
}
