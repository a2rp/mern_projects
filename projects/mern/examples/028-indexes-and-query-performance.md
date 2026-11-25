# 028 - Indexes and query performance: Complete example

This standalone Node.js example creates a fresh practice database, inserts a repeatable set of task documents, builds an index for a common filter-and-sort pattern, and inspects the query plan with execution statistics.

This file is documentation. The code is not run by this repository.

## What this example demonstrates

- Building a compound index from equality filters and a sort.
- Understanding which fields are index prefixes.
- Returning a small page in index order.
- Making a projection eligible for a covered query.
- Inspecting plan stages and execution statistics with `explain("executionStats")`.
- Comparing examined keys and documents with returned results.

## Prerequisites

1. Use Node.js with ES modules enabled. If needed, set `"type": "module"` in `package.json`.
2. Install the MongoDB Node.js driver:

~~~powershell
npm install mongodb
~~~

3. Set `MONGODB_URI` in the same PowerShell session where you run Node:

~~~powershell
$env:MONGODB_URI = "your MongoDB connection URI"
node .\indexes-query-performance.js
~~~

Each run creates a uniquely named database beginning with `mern_indexes_demo_`. The sample data stays in that practice database after the script ends; remove the database when you no longer need it.

## Complete code

Save this as `indexes-query-performance.js`:

~~~js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Set the MONGODB_URI environment variable before running this script."
  );
}

const client = new MongoClient(uri);

function collectStages(plan, stages = []) {
  if (!plan || typeof plan !== "object") {
    return stages;
  }

  if (typeof plan.stage === "string") {
    stages.push(plan.stage);
  }

  for (const value of Object.values(plan)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        collectStages(child, stages);
      }
    } else if (value && typeof value === "object") {
      collectStages(value, stages);
    }
  }

  return stages;
}

async function main() {
  try {
    await client.connect();

    const runId = new ObjectId().toHexString();
    const db = client.db("mern_indexes_demo_" + runId);
    const tasks = db.collection("tasks");

    const departments = [
      "design",
      "engineering",
      "marketing",
      "support",
      "sales"
    ];

    const sampleTasks = Array.from({ length: 2000 }, (_, index) => ({
      department: departments[index % departments.length],
      status: index % 2 === 0 ? "open" : "closed",
      dueAt: new Date(Date.UTC(2026, 0, 1) + index * 60_000),
      title: "Task " + String(index).padStart(4, "0")
    }));

    await tasks.insertMany(sampleTasks);

    const indexName = await tasks.createIndex(
      { department: 1, status: 1, dueAt: 1 },
      { name: "department_status_dueAt" }
    );

    const filter = {
      department: "design",
      status: "open"
    };

    // Excluding _id lets this projection use only fields present in the index.
    const projection = {
      _id: 0,
      department: 1,
      status: 1,
      dueAt: 1
    };

    const matchingDocuments = await tasks.countDocuments(filter);

    const explanation = await tasks
      .find(filter, { projection })
      .sort({ dueAt: 1 })
      .limit(10)
      .explain("executionStats");

    const stages = collectStages(
      explanation.queryPlanner.winningPlan
    );

    console.log("Index created:", indexName);
    console.log("Matching documents:", matchingDocuments);
    console.log(
      "Documents returned:",
      explanation.executionStats.nReturned
    );
    console.log("Winning plan uses IXSCAN:", stages.includes("IXSCAN"));
    console.log(
      "Index keys examined:",
      explanation.executionStats.totalKeysExamined
    );
    console.log(
      "Documents examined:",
      explanation.executionStats.totalDocsExamined
    );
  } finally {
    await client.close();
  }
}

await main();
~~~

## Expected output

For this dataset, the filter matches 200 documents and the cursor returns a page of 10:

~~~text
Index created: department_status_dueAt
Matching documents: 200
Documents returned: 10
Winning plan uses IXSCAN: true
Index keys examined: 10
Documents examined: 0
~~~

The exact plan stages and execution counts can vary by MongoDB server version and planner decisions. This projection contains only indexed fields and excludes `_id`, so it is eligible to be covered; a covered plan can return results without fetching collection documents. If your plan differs, inspect the full `queryPlanner.winningPlan` and execution statistics rather than assuming the index was ignored or that one result is universally faster.

## How it works

The example query filters on two equality fields and sorts by `dueAt`:

~~~javascript
{
  department: "design",
  status: "open"
}
~~~

~~~javascript
{ dueAt: 1 }
~~~

The compound index is ordered as `department`, `status`, then `dueAt`. The equality fields are first, and the last field provides the sort order for a fixed department and status. The index can also support queries on its prefixes, such as `department` alone or the pair `department` and `status`. It does not make a query on `status` alone a prefix lookup.

The projection requests only `department`, `status`, and `dueAt`, all of which are in the index. MongoDB normally includes `_id` in query results, so the projection explicitly excludes it. This makes the query eligible for a covered execution.

The script prints whether the winning plan includes an `IXSCAN` and reports `nReturned`, `totalKeysExamined`, and `totalDocsExamined`. A low amount of examined work relative to useful results is a good sign for this particular query, but performance should also be measured under representative application load.

## Try changing the example

- Remove the compound index in a separate fresh practice database and compare explain output.
- Filter only by `status` to see why it is not a leading prefix of this index.
- Add a range condition on `dueAt` and inspect how the index bounds and examined-key count change.
- Change the sort direction to descending and see whether MongoDB can scan the index in reverse.
- Include an unindexed field in the projection; the plan may need a `FETCH` stage.
- Remove `_id: 0` from the projection; the default identifier field may prevent this index from covering the projection.
- Add a second index only if a real query pattern needs it, then compare its read benefit with its storage and write cost.

## Important notes

- An index helps only when its keys and order match the query pattern well enough for the planner to use it.
- `IXSCAN` alone does not prove a query is efficient. Inspect the work performed and compare it with the useful results.
- Query plans and exact execution statistics depend on data distribution, server version, and planner choices.
- Indexes use storage and add work to inserts, updates, and deletes. Keep only indexes that provide measured value or enforce required constraints.
- The unique `_id` index is created automatically. The example's compound index is separate.
- Do not run index creation on every ordinary API request. Manage index changes through a controlled setup or deployment process.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [027 - Schema validation and data integrity](027-schema-validation-and-data-integrity.md) | [Q&A](../qnas/028-indexes-and-query-performance.md) | [029 - Aggregation pipelines](029-aggregation-pipelines.md) |
