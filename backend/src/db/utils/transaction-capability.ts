import mongoose from "mongoose";

type MongoHelloResponse = {
  msg?: unknown;
  setName?: unknown;
};

export const supportsMongoTransactions = (
  hello: MongoHelloResponse,
): boolean => {
  return (
    (typeof hello.setName === "string" && hello.setName.length > 0) ||
    hello.msg === "isdbgrid"
  );
};

export const assertMongoTransactionsSupported = async (): Promise<void> => {
  const database = mongoose.connection.db;

  if (!database) {
    throw new Error("MongoDB connection is unavailable for transaction capability verification.");
  }

  const hello = (await database.admin().command({ hello: 1 })) as MongoHelloResponse;

  if (!supportsMongoTransactions(hello)) {
    throw new Error(
      "MongoDB transactions require a replica set or sharded cluster. Configure MongoDB as a replica set before starting production.",
    );
  }
};
