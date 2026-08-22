import { vi, type Mock } from 'vitest';

/** Minimal session shape the protected procedures read from the context. */
export function createSession() {
  return {
    user: {
      id: 'user-1',
      email: 'reader@example.com',
      emailVerified: true,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

/**
 * Rows a scripted select returns, or a thunk evaluated when the query runs so
 * later queries observe rows mutated by earlier writes in the same procedure.
 */
export type ScriptedRows = unknown[] | (() => unknown[]);

function queryResult(rows: readonly unknown[]) {
  return Object.assign(Promise.resolve(rows), {
    orderBy: vi.fn(async () => rows),
  });
}

interface SelectChain {
  where: () => ReturnType<typeof queryResult>;
  innerJoin: () => SelectChain;
}

/** `db.select` mock returning the given row sets in call order. */
export function sequenceSelect(results: readonly ScriptedRows[]) {
  let index = 0;
  return vi.fn(() => {
    const result = results[index] ?? [];
    index += 1;
    const rows = Array.isArray(result) ? result : result();
    const chain: SelectChain = {
      where: () => queryResult(rows),
      innerJoin: () => chain,
    };
    return { from: () => chain };
  });
}

/** Stand-in database for router procedures; only the methods a test scripts exist. */
export interface ScriptedDatabase {
  select?: Mock;
  insert?: Mock;
  update?: Mock;
  delete?: Mock;
  transaction?: Mock;
}

function passthroughTransaction(database: ScriptedDatabase) {
  return vi.fn(async (runInTransaction: (tx: ScriptedDatabase) => Promise<object>) =>
    runInTransaction(database)
  );
}

/**
 * Builds a scripted database whose transaction mock hands the same database
 * back to the callback, mirroring drizzle's transaction semantics.
 */
export function createScriptedDatabase(queries: {
  select?: Mock;
  insert?: Mock;
  update?: Mock;
  delete?: Mock;
  transaction?: (database: ScriptedDatabase) => Mock;
}): ScriptedDatabase {
  const { transaction, ...tableOperations } = queries;
  const database: ScriptedDatabase = tableOperations;
  database.transaction = transaction ? transaction(database) : passthroughTransaction(database);
  return database;
}

/** Builds a caller whose context carries the scripted database and a signed-in session. */
export function createTestCaller<TContext, TCaller>(
  createCaller: (context: TContext) => TCaller,
  database: ScriptedDatabase
): TCaller {
  // SAFETY: the scripted database implements the query surface the router procedures use.
  // oxlint-disable-next-line anti-slop/no-chained-type-assertions
  return createCaller({
    db: database,
    session: createSession(),
    headers: new Headers(),
  } as unknown as TContext);
}
