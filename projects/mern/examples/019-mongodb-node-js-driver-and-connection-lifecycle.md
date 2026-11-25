# Example 019 - MongoDB Node.js Driver and Connection Lifecycle

## Question

How can a Node.js script connect to MongoDB, confirm the connection, reuse one client for database handles, and close its connections even if an operation fails?

## Goal

Build a small ES module that reads its connection URI from the environment, creates one MongoClient, pings MongoDB, creates database and collection handles, and closes the client in a finally block.

This example demonstrates:

- Installing the official MongoDB Node.js driver in a project.
- Passing a local connection URI through an environment variable.
- Explicitly connecting with one MongoClient.
- Sending a ping command to confirm the server responds.
- Reusing that client for database and collection handles.
- Closing the client after a short script finishes.

## Prerequisites

You need Node.js, npm, and a MongoDB deployment. Chapter 018 covers installing and starting a local deployment. A local server should be running before you run this example.

Use a new practice folder or an existing Node.js project. This script only pings the server and creates handles; it does not insert or modify documents.

## 1. Create a Node.js project and install the driver

In PowerShell, create a project and install the MongoDB driver:

~~~powershell
mkdir mern-driver-lifecycle-demo
cd mern-driver-lifecycle-demo
npm init -y
npm install mongodb
~~~

Use the driver version compatible with your installed Node.js release. The install command records the dependency in package.json and writes the resolved package tree to the lock file.

## 2. Set the connection URI for this terminal

For a local MongoDB server on the default port, set the URI for the current PowerShell session:

~~~powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017'
~~~

This environment variable is available to Node.js processes started from this terminal. For Atlas, set it to the URI generated for your own deployment. Do not write a real password into connect.mjs, this example file, or a committed project file.

## 3. Create connect.mjs

Create a file named connect.mjs in the project folder:

~~~javascript
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Set the MONGODB_URI environment variable.");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("MongoDB connection established.");

    const pingResult = await client.db("admin").command({ ping: 1 });
    console.log("Ping response:", pingResult);

    const database = client.db("mern_connection_lifecycle_demo");
    database.collection("courses");

    console.log("Database handle ready: mern_connection_lifecycle_demo");
    console.log("Collection handle ready: courses");
  } finally {
    await client.close();
    console.log("MongoDB client closed.");
  }
}

main().catch((error) => {
  console.error("MongoDB example failed:", error.message);
  process.exitCode = 1;
});
~~~

The client is constructed once. It is explicitly connected before the ping. The same client is used to select the application database and collection. Selecting handles does not insert data or persist an empty database.

The finally block closes the client after the ping succeeds or if a later operation throws. The error handler reports the failure without printing the full connection URI.

## 4. Run the script

Keep the local MongoDB service or server process running, then run:

~~~powershell
node connect.mjs
~~~

## Expected output

With a reachable MongoDB server and the local URI, the output is similar to:

~~~text
MongoDB connection established.
Ping response: { ok: 1 }
Database handle ready: mern_connection_lifecycle_demo
Collection handle ready: courses
MongoDB client closed.
~~~

The precise object formatting can vary by Node.js version and terminal. The ping response should contain an ok value of 1.

## What happens in order

1. The script reads MONGODB_URI from the process environment.
2. It constructs one MongoClient.
3. It waits for client.connect() to succeed.
4. It sends a ping command and waits for the server's response.
5. It creates database and collection handles using the same client.
6. The finally block closes the client's connection pool.
7. If an error occurs, the catch handler logs a short message and sets a failing process exit code.

MongoClient can connect lazily when the first database operation runs in supported driver versions. This script calls connect() explicitly so connection failure happens before it reports a successful ping.

## Try the missing-configuration path

In a new PowerShell session, do not set MONGODB_URI and run the script. It reports an error similar to:

~~~text
MongoDB example failed: Set the MONGODB_URI environment variable.
~~~

Set the variable in the terminal and try again. Do not fix this case by hard-coding a credential-bearing URI in the source file.

## Connection lifecycle in a long-running server

This example is a short script, so it closes the client before exiting. A web application has a longer lifecycle:

| Stage | Server behavior |
| --- | --- |
| Startup | Create one client and connect before marking database-dependent routes ready |
| Request handling | Reuse the same client and its pool; get database handles from it |
| Shutdown | Stop accepting requests, let active requests finish, then close the client |

Do not copy the short-script pattern of closing MongoClient after every route request. A server should keep the shared client available while it serves requests and close it during graceful shutdown.

When an application runs multiple Node.js worker processes, each process generally creates and reuses its own client. Do not create a client for every request.

## Troubleshooting

- **The script says MONGODB_URI is missing:** set the variable in the PowerShell session that launches Node.js.
- **Connection refused:** confirm the local MongoDB service or manually started server is running and that the URI host and port match.
- **Server selection timeout:** verify the host, DNS, network, and deployment availability. For Atlas, also verify the network access list.
- **Authentication failure:** verify the database user, password, authentication database, and any URI encoding needed for reserved characters.
- **A connection URI appears in logs:** change the logging to report the error category or message without printing the URI.

Do not expose a database publicly as a shortcut for resolving a local connection error.

## What this example demonstrates

- A MongoClient can be explicitly connected before the first application operation.
- One client manages a pool that can be reused.
- Database and collection handles are selected through the same client.
- A ping confirms that the server responds.
- A finally block gives a one-time script a predictable cleanup point.
- Long-running servers keep a client for the process lifetime and close it after request handling drains.

## Key takeaways

- Read the URI from runtime configuration.
- Create one MongoClient per long-running application process.
- Reuse the client across operations and requests.
- Close a short-lived script's client in finally.
- In a server, stop and drain HTTP work before closing the shared database client.
- Never commit or log a credential-bearing connection URI.

## Related chapter files

- [Lesson 019 - MongoDB Node.js driver and connection lifecycle](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md)
- [Q&A 019 - MongoDB Node.js driver and connection lifecycle](../qnas/019-mongodb-node-js-driver-and-connection-lifecycle.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [018 - Install, run, and connect to MongoDB](../lessons/018-install-run-and-connect-to-mongodb.md) | [Lesson](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md) | [Q&A](../qnas/019-mongodb-node-js-driver-and-connection-lifecycle.md) | Example | [020 - Create and read MongoDB documents](../lessons/020-create-and-read-mongodb-documents.md) |
