import type { ClientSession } from "mongoose";
import mongoose from "mongoose";

export const withTransaction = async <TResult>(
  operation: (session: ClientSession) => Promise<TResult>,
): Promise<TResult> => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => operation(session));
  } finally {
    await session.endSession();
  }
};

