# 030 - Transactions and atomic operations: Complete example

This standalone Node.js example transfers money between two account documents and writes a ledger record in one MongoDB transaction. It then tries an unaffordable transfer to demonstrate that the debit and ledger write do not partially commit.

This file is documentation. The code is not run by this repository.

## What this example demonstrates

- A multi-document transaction using the Node.js driver's convenient API.
- Passing the same session to every participating database operation.
- A conditional debit that prevents the balance from going below zero.
- A destination credit and ledger insert in the same transaction.
- Aborting on a business-rule failure.
- Keeping retry-sensitive identifiers outside the transaction callback.
- Ending a session in a `finally` block.

## Prerequisites

1. Use Node.js with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Connect to a MongoDB replica set or suitable sharded cluster that supports multi-document transactions. A standalone server does not support them.
4. Set `MONGODB_URI` in the same PowerShell session where you run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\transactions-atomic-transfer.js
~~~

Each run creates a uniquely named practice database beginning with `mern_transaction_demo_`. It leaves the practice data in that database; remove it when you no longer need it.

## Complete code

Save this as `transactions-atomic-transfer.js`:

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const client = new MongoClient(uri);

class InsufficientFundsError extends Error {
  constructor() {
    super("The source account is missing or has insufficient funds.");
    this.name = "InsufficientFundsError";
  }
}

class DestinationAccountError extends Error {
  constructor() {
    super("The destination account does not exist.");
    this.name = "DestinationAccountError";
  }
}

function formatMoney(cents) {
  return "$" + (cents / 100).toFixed(2);
}

async function transferFunds({
  client,
  accounts,
  transfers,
  sourceAccountId,
  destinationAccountId,
  amountCents
}) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Transfer amount must be a positive integer number of cents.");
  }

  if (sourceAccountId.equals(destinationAccountId)) {
    throw new Error("Source and destination accounts must be different.");
  }

  // Keep identifiers stable if the transaction callback is retried.
  const transferId = new ObjectId();
  const createdAt = new Date();
  const session = client.startSession();

  try {
    await session.withTransaction(
      async () => {
        const debit = await accounts.updateOne(
          {
            _id: sourceAccountId,
            balanceCents: { $gte: amountCents }
          },
          {
            $inc: { balanceCents: -amountCents }
          },
          { session }
        );

        if (debit.matchedCount !== 1) {
          throw new InsufficientFundsError();
        }

        const credit = await accounts.updateOne(
          { _id: destinationAccountId },
          { $inc: { balanceCents: amountCents } },
          { session }
        );

        if (credit.matchedCount !== 1) {
          throw new DestinationAccountError();
        }

        await transfers.insertOne(
          {
            _id: transferId,
            sourceAccountId,
            destinationAccountId,
            amountCents,
            createdAt
          },
          { session }
        );
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" }
      }
    );

    return transferId;
  } finally {
    await session.endSession();
  }
}

async function main() {
  try {
    await client.connect();

    const databaseName =
      "mern_transaction_demo_" + new ObjectId().toHexString();
    const db = client.db(databaseName);

    // Create collections before the transaction so the transaction only
    // performs writes to collections that already exist.
    await db.createCollection("accounts");
    await db.createCollection("transfers");

    const accounts = db.collection("accounts");
    const transfers = db.collection("transfers");

    const accountAId = new ObjectId();
    const accountBId = new ObjectId();

    await accounts.insertMany([
      {
        _id: accountAId,
        owner: "Account A",
        balanceCents: 50000
      },
      {
        _id: accountBId,
        owner: "Account B",
        balanceCents: 20000
      }
    ]);

    await transferFunds({
      client,
      accounts,
      transfers,
      sourceAccountId: accountAId,
      destinationAccountId: accountBId,
      amountCents: 12500
    });

    console.log("Transfer committed:", formatMoney(12500));

    try {
      await transferFunds({
        client,
        accounts,
        transfers,
        sourceAccountId: accountAId,
        destinationAccountId: accountBId,
        amountCents: 40000
      });
    } catch (error) {
      if (!(error instanceof InsufficientFundsError)) {
        throw error;
      }

      console.log("Second transfer rejected: insufficient funds.");
    }

    const accountA = await accounts.findOne({ _id: accountAId });
    const accountB = await accounts.findOne({ _id: accountBId });

    console.log("Account A balance:", formatMoney(accountA.balanceCents));
    console.log("Account B balance:", formatMoney(accountB.balanceCents));
    console.log("Transfer records:", await transfers.countDocuments());
  } finally {
    await client.close();
  }
}

await main();
~~~

## Expected output

~~~text
Transfer committed: $125.00
Second transfer rejected: insufficient funds.
Account A balance: $375.00
Account B balance: $325.00
Transfer records: 1
~~~

## How it works

1. The script creates two accounts and stores balances as integer cents to avoid floating-point currency arithmetic.
2. The successful transfer starts a session transaction.
3. The debit filter requires both the source account ID and a balance at least as large as the transfer amount. The decrement uses `$inc` in the same atomic document write.
4. The destination credit and ledger insert use the same session, so they participate in the transaction.
5. If the destination is missing or any operation fails, the callback throws and the transaction aborts.
6. The second attempt asks to transfer more than Account A has. The debit matches no document, the callback throws `InsufficientFundsError`, and the transaction aborts before crediting Account B or inserting a ledger entry.
7. The final balances and record count show that only the successful transfer committed.

## Important notes

- The transaction callback can run more than once for certain retryable errors. This example creates the transfer ID and timestamp before the callback and does not call external services inside it.
- A transaction does not make an email, message-broker publish, or payment-provider call atomic with MongoDB. Use an outbox and idempotent processing for external effects.
- The transfer ID here is stable only for retries of this one callback. A production endpoint should also accept and persist an idempotency key so a client retry cannot create a second transfer.
- All operations that belong to the transaction pass `{ session }`. A database operation that omits it runs outside the transaction.
- Transaction operations run sequentially; do not use `Promise.all()` inside the transaction callback.
- The source debit is conditional and its result is checked. Checking write results is part of enforcing the business invariant.
- This example uses transaction-level read and write concerns. Do not set separate write concerns on individual operations inside the transaction.
- Keep production transactions short and test them against the same type of deployment the application uses.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [029 - Aggregation pipelines](029-aggregation-pipelines.md) | [Q&A](../qnas/030-transactions-and-atomic-operations.md) | [031 - Mongoose ODM: when and how to use it](../lessons/031-mongoose-odm-when-and-how-to-use-it.md) |
