import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { FridgeService } from "src/services/fridge/fridge-service.js";
import { FridgeRepository } from "src/services/fridge/storage/fridge-repository.js";

test(
  "MySQL fridge persistence, duplicate handling, isolation, and atomic writes",
  {
    skip: process.env.RUN_DB_TESTS !== "1",
  },
  async () => {
    const { default: db } = await import("src/storage/db/knex.js");
    const trx = await db.transaction();
    try {
      const tag = randomUUID();
      const users: number[] = [];
      for (const suffix of ["a", "b"]) {
        const [id] = await trx("users").insert({
          first_name: "Test",
          last_name: "Fridge",
          email: `${tag}-${suffix}@example.com`,
        });
        assert.ok(id);
        users.push(id);
      }
      const [firstUser, secondUser] = users;
      assert.ok(firstUser && secondUser);
      const repository = new FridgeRepository(trx);
      const service = new FridgeService(repository);
      const name = `test ingredient ${tag}`;
      assert.deepEqual(await service.list(firstUser), []);
      const first = await service.add(firstUser, { name });
      assert.equal(first.length, 1);
      assert.equal(first[0]?.name, name);
      const ingredientId = first[0]!.id;
      assert.deepEqual(await service.add(firstUser, { name }), first);
      assert.deepEqual(await new FridgeRepository(trx).list(firstUser), first);
      assert.deepEqual(await service.list(secondUser), []);
      await service.add(secondUser, { name });
      assert.deepEqual(await service.remove(firstUser, ingredientId), []);
      assert.deepEqual(await service.remove(firstUser, ingredientId), []);
      assert.deepEqual(await service.list(secondUser), first);
      assert.ok(await trx("ingredients").where({ id: ingredientId }).first());

      const failedName = `rollback ${tag}`;
      await assert.rejects(repository.add(0, failedName));
      assert.equal(
        await trx("ingredients").where({ name: failedName }).first(),
        undefined,
      );
    } finally {
      await trx.rollback();
      await db.destroy();
    }
  },
);
