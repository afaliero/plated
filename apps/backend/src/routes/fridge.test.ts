import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import type { AddFridgeItemRequest, FridgeItem } from "@plated/shared";
import { AppError } from "src/lib/errors.js";
import { fridgeRouter } from "src/routes/fridge.js";
import { Orchestrator } from "src/routes/orchestrator.js";
import type { FridgeServiceContract } from "src/services/fridge/types.js";

function setup() {
  const calls: unknown[] = [];
  const items: FridgeItem[] = [{ id: 7, name: "olive oil" }];
  const fridge: FridgeServiceContract = {
    async list(userId) {
      calls.push(["list", userId]);
      return items;
    },
    async add(userId: number, input: AddFridgeItemRequest) {
      calls.push(["add", userId, input]);
      return items;
    },
    async remove(userId, ingredientId) {
      calls.push(["remove", userId, ingredientId]);
      return [];
    },
  };
  const orchestrator = new Orchestrator(
    {
      async suggest() {
        throw new Error("Recipes should not be called.");
      },
      async detail() {
        throw new Error("Recipes should not be called.");
      },
    },
    fridge,
  );
  const app = new Hono();
  app.route("/fridge", fridgeRouter(orchestrator));
  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(
        { error: { code: error.code, message: error.message } },
        400,
      );
    }
    return c.json({ error: { code: "internal_error" } }, 500);
  });
  return { app, calls, items, fridge };
}

test("reads the backend-selected fridge and ignores client identity", async () => {
  const { app, calls, items } = setup();
  const response = await app.request("/fridge?userId=2", {
    headers: { "X-User-Id": "2" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { items });
  assert.deepEqual(calls, [["list", 1]]);
});

test("normalizes an addition and returns the saved inventory", async () => {
  const { app, calls, items } = setup();
  const response = await app.request("/fridge/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "  OLIVE   Oil  " }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { items });
  assert.deepEqual(calls, [["add", 1, { name: "olive oil" }]]);
});

test("rejects malformed JSON, invalid names, and client-supplied ownership", async () => {
  for (const body of [
    "{",
    "null",
    "{}",
    '{"name":42}',
    '{"name":"   "}',
    JSON.stringify({ name: "x".repeat(151) }),
    '{"name":"rice","userId":2}',
  ]) {
    const { app, calls } = setup();
    const response = await app.request("/fridge/items", {
      method: "POST",
      body,
    });
    assert.equal(response.status, 400, body);
    assert.deepEqual(calls, []);
  }
});

test("removes an ingredient from the backend-selected fridge", async () => {
  const { app, calls } = setup();
  const response = await app.request("/fridge/items/7", { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { items: [] });
  assert.deepEqual(calls, [["remove", 1, 7]]);
});

test("rejects invalid ingredient IDs before reaching storage", async () => {
  for (const id of ["0", "-1", "1.5", "1e2", "abc", "9007199254740992"]) {
    const { app, calls } = setup();
    const response = await app.request(`/fridge/items/${id}`, {
      method: "DELETE",
    });
    assert.equal(response.status, 400, id);
    assert.deepEqual(calls, []);
  }
});

test("a failed write does not return a successful inventory response", async () => {
  const { app, fridge } = setup();
  fridge.add = async () => {
    throw new Error("Database unavailable");
  };
  const response = await app.request("/fridge/items", {
    method: "POST",
    body: JSON.stringify({ name: "rice" }),
  });
  assert.equal(response.status, 500);
});
