# 029 - Aggregation pipelines: Complete example

This standalone Node.js example builds a small orders report using an aggregation pipeline. It filters paid orders, expands their item arrays, joins catalog products, calculates line revenue, groups by category, and returns a sorted summary.

This file is documentation. The code is not run by this repository.

## What this example demonstrates

- Building a multi-stage pipeline in the Node.js driver.
- Filtering source documents before later processing.
- Expanding order items with `$unwind`.
- Joining a catalog collection with `$lookup`.
- Computing a derived value with `$multiply`.
- Grouping with `$sum` and `$addToSet`.
- Shaping and sorting the final report.
- Indexing the initial filter fields and foreign join key.

## Prerequisites

1. Use Node.js with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same PowerShell session where you run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\aggregation-pipeline-report.js
~~~

Each run creates a uniquely named practice database beginning with `mern_aggregation_demo_`. It keeps the sample collections after the script ends; remove this practice database when you no longer need it.

## Complete code

Save this as `aggregation-pipeline-report.js`:

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();

    const runId = new ObjectId().toHexString();
    const db = client.db("mern_aggregation_demo_" + runId);
    const products = db.collection("products");
    const orders = db.collection("orders");

    await products.createIndex(
      { sku: 1 },
      { unique: true, name: "sku_unique" }
    );
    await orders.createIndex(
      { status: 1, createdAt: 1 },
      { name: "status_createdAt" }
    );

    await products.insertMany([
      {
        sku: "PEN-A",
        category: "stationery",
        unitPrice: 2
      },
      {
        sku: "NOTE-B",
        category: "stationery",
        unitPrice: 5
      },
      {
        sku: "MUG-C",
        category: "drinkware",
        unitPrice: 12.5
      }
    ]);

    await orders.insertMany([
      {
        orderNo: "ORD-1001",
        status: "paid",
        createdAt: new Date("2026-02-02T12:00:00.000Z"),
        items: [
          { sku: "PEN-A", quantity: 2 },
          { sku: "MUG-C", quantity: 1 }
        ]
      },
      {
        orderNo: "ORD-1002",
        status: "paid",
        createdAt: new Date("2026-02-12T12:00:00.000Z"),
        items: [
          { sku: "NOTE-B", quantity: 3 },
          { sku: "PEN-A", quantity: 1 }
        ]
      },
      {
        orderNo: "ORD-1003",
        status: "pending",
        createdAt: new Date("2026-03-01T12:00:00.000Z"),
        items: [
          { sku: "MUG-C", quantity: 2 }
        ]
      },
      {
        orderNo: "ORD-1004",
        status: "paid",
        createdAt: new Date("2026-03-15T12:00:00.000Z"),
        items: [
          { sku: "MUG-C", quantity: 1 },
          { sku: "NOTE-B", quantity: 2 }
        ]
      }
    ]);

    const startOfPeriod = new Date("2026-01-01T00:00:00.000Z");
    const startOfNextPeriod = new Date("2026-04-01T00:00:00.000Z");

    const pipeline = [
      {
        $match: {
          status: "paid",
          createdAt: {
            $gte: startOfPeriod,
            $lt: startOfNextPeriod
          }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.sku",
          foreignField: "sku",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $set: {
          category: "$product.category",
          lineRevenue: {
            $multiply: [
              "$items.quantity",
              "$product.unitPrice"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$category",
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$lineRevenue" },
          orderIds: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          unitsSold: 1,
          revenue: 1,
          paidOrderCount: { $size: "$orderIds" }
        }
      },
      { $sort: { revenue: -1, category: 1 } },
      { $limit: 10 }
    ];

    const report = await orders.aggregate(pipeline).toArray();

    console.log("Sales report by category:");
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.close();
  }
}

await main();
~~~

## Expected output

~~~text
Sales report by category:
[
  {
    "category": "stationery",
    "unitsSold": 8,
    "revenue": 31,
    "paidOrderCount": 3
  },
  {
    "category": "drinkware",
    "unitsSold": 2,
    "revenue": 25,
    "paidOrderCount": 2
  }
]
~~~

## How the pipeline works

1. **`$match`** keeps paid orders created in the inclusive start / exclusive end date range. The status/date index is a candidate for this initial filter.
2. **`$unwind`** emits one pipeline document for each order item.
3. **`$lookup`** matches each item's SKU to the product catalog. The unique SKU index supports the foreign-key lookup pattern.
4. **`$unwind`** turns the matching product array into one joined product document. In this dataset every SKU exists, so no item is dropped.
5. **`$set`** computes each line's revenue using the item's quantity and catalog unit price.
6. **`$group`** combines item rows by category, sums units and revenue, and collects distinct order identifiers.
7. **`$project`** renames the group key and calculates the number of distinct paid orders.
8. **`$sort`** orders categories by revenue, with category as a tie-breaker.
9. **`$limit`** caps the report at ten rows.

## Try changing the example

- Change one order's status to `"pending"` and observe that its items no longer contribute.
- Change the date range and compare which orders reach the `$unwind` stage.
- Add a product and an order item, then calculate the expected group totals before reading the output.
- Remove a catalog SKU in a separate fresh run. The second `$unwind` drops order items with no product match. Decide whether unmatched items should instead be preserved and reported.
- Add a `$project` after the first `$match` to experiment with a smaller document shape; inspect the explain plan rather than assuming an early projection always improves performance.
- Replace the final report with a different group key such as product SKU, but update the projected fields and expected results.

## Important notes

- This report uses the catalog's current category and price. For historical sales reporting, store the purchase-time price and any required category snapshot on each order item; a later catalog edit should not rewrite past revenue.
- The `$lookup` behaves like a left outer join and creates an array. The following default `$unwind` drops documents with no join match. Keep or discard unmatched documents intentionally.
- The indexes support candidate access patterns, but the query planner and data distribution determine actual use. Inspect explain output with representative data.
- Pipeline stages can be optimized or absorbed by MongoDB, so an explain plan may not display the exact same sequence as the source array.
- The aggregation only reads and returns the report. It does not change the order or product collections. Adding `$merge` or `$out` would make it write results.
- The script uses `toArray()` because this small report is bounded. For a large result set, iterate the aggregation cursor instead.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [028 - Indexes and query performance](028-indexes-and-query-performance.md) | [Q&A](../qnas/029-aggregation-pipelines.md) | [030 - Transactions and atomic operations](../lessons/030-transactions-and-atomic-operations.md) |
