import type { ClientSession } from "mongoose";
import mongoose from "mongoose";

let isReplicaSet: boolean | null = null;

const checkReplicaSetSupport = async (): Promise<boolean> => {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const db = mongoose.connection.db;
    if (!db) return false;
    const hello = (await db.admin().command({ hello: 1 })) as {
      setName?: unknown;
      msg?: unknown;
    };
    isReplicaSet = Boolean(
      (typeof hello.setName === "string" && hello.setName.length > 0) ||
      hello.msg === "isdbgrid"
    );
    return isReplicaSet;
  } catch {
    return false;
  }
};

export const withTransaction = async <TResult>(
  operation: (session?: ClientSession) => Promise<TResult>,
): Promise<TResult> => {
  const supportsTransactions = await checkReplicaSetSupport();

  if (!supportsTransactions) {
    return operation();
  }

  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => operation(session));
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("Transaction numbers are only allowed on a replica set member or mongos")
    ) {
      isReplicaSet = false;
      return operation();
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
