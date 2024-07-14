import { addDay, parse } from "@formkit/tempo";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { account, transaction } from "@/db/schema";

import { insertTransactionSchema } from "./schema";

export const transactions = new Hono()
  .get(
    "/",
    clerkMiddleware(),
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const defaultTo = new Date();
      const defaultFrom = addDay(defaultTo, -30);

      const startDate = from ? parse(from, "YYYY-MM-DD") : defaultFrom;
      const endDate = to ? parse(to, "YYYY-MM-DD") : defaultTo;

      const data = await db
        .select({
          id: transaction.id,
          amount: transaction.amount,
          payee: transaction.payee,
          date: transaction.date,
          account: account.name,
          accountId: transaction.accountId,
        })
        .from(transaction)
        .innerJoin(account, eq(transaction.accountId, account.id))
        .where(
          and(
            eq(account.userId, auth.userId),
            accountId ? eq(transaction.accountId, accountId) : undefined,
            gte(transaction.date, startDate),
            lte(transaction.date, endDate),
          ),
        )
        .orderBy(desc(transaction.date));

      return c.json({ data });
    },
  )
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing account ID" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .select({
          id: transaction.id,
          amount: transaction.amount,
          payee: transaction.payee,
          date: transaction.date,
          accountId: transaction.accountId,
        })
        .from(transaction)
        .innerJoin(account, eq(transaction.accountId, account.id))
        .where(and(eq(account.userId, auth.userId), eq(transaction.id, id)));

      if (!data) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json({ data });
    },
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertTransactionSchema),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .insert(transaction)
        .values({
          id: createId(),
          ...values,
          date: new Date(values.date),
        })
        .returning();

      return c.json({ data });
    },
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertTransactionSchema),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Missing account ID" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transactionsToUpdate = db.$with("transactions_to_update").as(
        db
          .select({ id: transaction.id })
          .from(transaction)
          .innerJoin(account, eq(transaction.accountId, account.id))
          .where(and(eq(account.userId, auth.userId), eq(transaction.id, id))),
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transaction)
        .set({
          ...values,
          date: new Date(values.date),
        })
        .where(
          inArray(
            transaction.id,
            sql`(SELECT id FROM ${transactionsToUpdate})`,
          ),
        )
        .returning();

      if (!data) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json({ data });
    },
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing account ID" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transaction.id })
          .from(transaction)
          .innerJoin(account, eq(transaction.accountId, account.id))
          .where(and(eq(account.userId, auth.userId), eq(transaction.id, id))),
      );

      const [data] = await db
        .with(transactionsToDelete)
        .delete(transaction)
        .where(
          inArray(
            transaction.id,
            sql`(SELECT id FROM ${transactionsToDelete})`,
          ),
        )
        .returning({
          id: account.id,
        });

      if (!data) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json({ data });
    },
  );
