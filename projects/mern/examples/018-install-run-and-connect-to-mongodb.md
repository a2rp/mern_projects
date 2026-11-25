# Example 018 - Install, Run, and Connect to MongoDB

## Question

How do you start a local MongoDB deployment on Windows, connect to it with mongosh, and confirm the server is responding?

## Goal

Choose one local startup method, connect to the server, send a ping command, and select a practice database context.

This example demonstrates:

- Checking the server and shell versions.
- Checking the MongoDB Windows service, or starting mongod manually.
- Connecting to the local server with a MongoDB URI.
- Confirming the connection with a ping.
- Choosing a database context without inserting any documents.
- An optional shell connection to an Atlas deployment.

## Prerequisites

Install MongoDB Community Server and MongoDB Shell separately if needed. Open PowerShell or Windows Terminal. Use a local learning deployment for the first part of this example.

Do not run both startup methods against the same data directory. If the MongoDB service is already using its configured directory, connect to that service instead of starting another mongod process.

## 1. Check that the tools are available

In PowerShell, check the versions:

~~~powershell
mongod --version
mongosh --version
~~~

The output includes version information for the server binary and the shell. They can have different version numbers because they are separate tools.

If either command is not recognized, install that tool or add its executable directory to PATH. Open a new terminal after changing PATH.

## 2. Start the local server

Choose the method that matches how you installed MongoDB.

### Option A: Start the Windows service

If you configured MongoDB as a service, check its status:

~~~powershell
Get-Service -Name MongoDB
~~~

When the service is running, the Status column says Running. If it is stopped, open the Windows Services application, select the MongoDB service, and start it. The default service name is MongoDB; a custom installation may use another name.

Do not run the manual startup commands in Option B while the service is already using its data directory.

### Option B: Start mongod manually

Use this option only if you did not install the MongoDB service. Open a separate PowerShell window and create a data directory under your Windows user profile:

~~~powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\mongodb-data" -Force
~~~

Start the server with that directory:

~~~powershell
mongod --dbpath "$env:USERPROFILE\mongodb-data"
~~~

Keep this terminal open while the server runs. The console prints startup messages; look for a line similar to:

~~~text
[initandlisten] waiting for connections
~~~

If PowerShell cannot find mongod, run the executable using its installation path. Do not start a second server against a directory already in use by the MongoDB service.

## 3. Connect with mongosh

Open another terminal. The server must remain running in its service or server terminal. Connect to the local loopback address:

~~~powershell
mongosh "mongodb://127.0.0.1:27017"
~~~

The shell prints connection information and then displays an interactive prompt. The exact version numbers and prompt text vary.

## 4. Confirm that the server responds

At the mongosh prompt, run:

~~~javascript
db.runCommand({ ping: 1 })
~~~

A successful response is similar to:

~~~javascript
{ ok: 1 }
~~~

This confirms that mongosh connected to the server and the server responded to a database command.

## 5. Select a practice database context

Still in mongosh, select a name for later practice:

~~~javascript
use mern_connection_demo
db.getName()
~~~

Expected result:

~~~text
mern_connection_demo
~~~

This changes the current database context. It does not write a document or necessarily create persistent database data. Document inserts and reads are covered in the following chapters.

Leave the shell:

~~~javascript
exit
~~~

If you started mongod manually, stop it only after leaving the shell. Return to the terminal running the server, press Ctrl+C, and wait for shutdown to finish. A service can be managed separately through Windows Services.

## Optional: Connect to an Atlas deployment

If you already have an Atlas deployment, copy its shell connection string from the Atlas connection flow. Use the database user's credentials and allow the client machine's IP address in the deployment's network access settings.

A connection command has a shape like this:

~~~powershell
mongosh "mongodb+srv://<db_user>:<encoded_password>@<cluster-host>/?retryWrites=true&w=majority"
~~~

Replace the placeholders with values from your deployment. The real URI contains credentials, so do not save it in this Markdown file, commit it to source control, or share it in a screenshot. Encode reserved characters in the username or password as required by the connection URI format.

The Atlas website account and database user are different credentials. If the connection times out, check the client's IP access rule and the cluster host. If authentication fails, check the database user, password, and URI encoding.

## Optional: Use Compass

MongoDB Compass is a graphical client. Open Compass and use the same local URI, mongodb://127.0.0.1:27017, to connect to the local deployment. For Atlas, use the deployment URI and credentials through Compass's connection form. Compass does not start a missing local MongoDB server.

## Expected workflow

~~~text
PowerShell terminal A
  MongoDB service, or a manually started mongod process

PowerShell terminal B
  mongosh connects to 127.0.0.1:27017
  ping returns { ok: 1 }
  select a database context
~~~

For a service installation, the service can run in the background and you only need the shell terminal. For a manual installation, keep both the server and shell terminals available during the exercise.

## Troubleshooting guide

- **mongod or mongosh is not recognized:** verify that the corresponding tool is installed, check PATH, then open a fresh terminal.
- **Get-Service reports that MongoDB cannot be found:** the service may not have been installed or it may have a custom name. Check the Services application or use the manual startup option if no service is configured.
- **Connection refused:** confirm the server is running, then check that the URI host and port match the server.
- **The server cannot open the data directory:** verify the directory exists and that your Windows account or service account can write to it.
- **Atlas connection times out:** verify the cluster host, network access rule, and outbound network connection.
- **Atlas authentication fails:** verify the database user's credentials and encode reserved URI characters.

Do not change network binding or firewall rules just to hide an error. Keep a learning server local unless you have deliberately configured secure remote access.

## What this example demonstrates

- A server and its shell client are separate processes and tools.
- A Windows service and a manually started server are alternate ways to run a local deployment.
- mongosh connects to a server using a connection URI.
- A ping command confirms basic server reachability.
- Selecting a database context does not itself insert data.
- Atlas connections require the deployment URI, database credentials, and allowed network access.

## Key takeaways

- Start exactly one server process for a given data directory.
- Use 127.0.0.1:27017 for the common local default.
- Keep the manually started server terminal open until you finish.
- Do not commit or share an Atlas URI that contains credentials.
- Keep a learning deployment bound to the local machine unless remote access is deliberately secured.

## Related chapter files

- [Lesson 018 - Install, run, and connect to MongoDB](../lessons/018-install-run-and-connect-to-mongodb.md)
- [Q&A 018 - Install, run, and connect to MongoDB](../qnas/018-install-run-and-connect-to-mongodb.md)

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [017 - BSON, ObjectId, and document shape](../lessons/017-bson-objectid-and-document-shape.md) | [Lesson](../lessons/018-install-run-and-connect-to-mongodb.md) | [Q&A](../qnas/018-install-run-and-connect-to-mongodb.md) | Example | [019 - MongoDB Node.js driver and connection lifecycle](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md) |
