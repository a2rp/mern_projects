# 018 - Install, Run, and Connect to MongoDB: Questions and Answers

Use these questions to review MongoDB's server and client tools, local Windows setup, shell connections, Atlas access, and basic troubleshooting. Each answer includes a short explanation.

Related lesson: [018 - Install, run, and connect to MongoDB](../lessons/018-install-run-and-connect-to-mongodb.md)

## Multiple-choice questions

### 1. Which program runs a self-managed MongoDB database server?

- A. **mongod**
- B. **mongosh**
- C. MongoDB Compass
- D. A browser

**Answer: A.** **mongod** is the server process that stores data and accepts database requests.

### 2. What is mongosh?

- A. A command-line client that connects to MongoDB deployments
- B. The database server's data directory
- C. A Windows service manager
- D. A JavaScript framework

**Answer: A.** **mongosh** is an interactive shell client. It can connect to local or remote MongoDB deployments.

### 3. Does installing MongoDB Server on Windows always install mongosh too?

- A. Yes, they are always one inseparable program.
- B. No. mongosh is distributed separately and may need to be installed separately.
- C. Yes, but only if Compass is installed.
- D. No. mongosh only runs on Linux.

**Answer: B.** The server and shell are separate tools. Check that both are installed before using their commands.

### 4. What does MongoDB Compass provide?

- A. An optional graphical client for connecting to and inspecting a deployment
- B. The Windows database service itself
- C. A replacement for all database users
- D. The MongoDB data directory

**Answer: A.** Compass is a GUI client. Installing it alone does not start a local MongoDB server.

### 5. What does a MongoDB application driver do?

- A. Lets application code communicate with a MongoDB deployment
- B. Creates Windows user accounts
- C. Replaces the MongoDB server
- D. Starts the browser

**Answer: A.** A driver is a library used by application code; the Node.js driver is covered in the next chapter.

### 6. Which connection string commonly targets MongoDB on the same computer?

- A. **mongodb://127.0.0.1:27017**
- B. **https://127.0.0.1**
- C. **mongodb+srv://localhost:27017**
- D. **file://mongodb**

**Answer: A.** The URI identifies the local loopback host and MongoDB's default port.

### 7. What is the default MongoDB port commonly used by a local server?

- A. 80
- B. 443
- C. 27017
- D. 3306

**Answer: C.** MongoDB uses port 27017 by default for a local deployment unless configured otherwise.

### 8. What does 127.0.0.1 mean in a connection string?

- A. The current computer
- B. Every computer on the internet
- C. The Atlas username
- D. A database name

**Answer: A.** The loopback address refers to the machine running the client.

### 9. What does the command db.runCommand({ ping: 1 }) check?

- A. Whether the connected server can respond to a database command
- B. Whether a document has a field named ping
- C. Whether Compass is installed
- D. Whether a Windows account password is correct

**Answer: A.** A successful response containing ok: 1 confirms the shell reached the server and the server handled the command.

### 10. What usually happens when you select a database with use mern_demo in mongosh?

- A. It changes the current database context; the database may not be stored until data is written.
- B. It immediately deletes other databases.
- C. It installs the database server.
- D. It creates an Atlas database user.

**Answer: A.** Selecting a database name changes the shell context. MongoDB normally persists the database after a write creates data.

### 11. What is a Windows service useful for when running MongoDB locally?

- A. It lets Windows start and manage the MongoDB server process.
- B. It converts a database to a browser page.
- C. It replaces the data directory.
- D. It grants Atlas access automatically.

**Answer: A.** A Windows service can start the server in the background and can be managed through Services.

### 12. If MongoDB was not installed as a service, how can a learner start it manually?

- A. Run mongod and specify a writable data directory with --dbpath.
- B. Run mongosh --delete-server.
- C. Open Compass without installing a server.
- D. Change the database name in the README.

**Answer: A.** The server needs a data directory. Keep the terminal open while a manually started process runs.

### 13. Why should you not start a second mongod against a data directory already used by the Windows service?

- A. A data directory should be owned by only one running server process at a time.
- B. MongoDB allows exactly one database per computer.
- C. mongosh cannot connect to a server started as a service.
- D. It automatically changes all document types.

**Answer: A.** Two server processes must not use the same data files concurrently.

### 14. What should you try if Windows reports that mongosh is not recognized?

- A. Confirm it is installed, add its executable directory to PATH, and open a new terminal.
- B. Expose port 27017 to the internet.
- C. Rename the database.
- D. Reinstall the Node.js driver only.

**Answer: A.** The shell executable must be installed and available on the terminal's PATH.

### 15. What is a typical cause of connection refused at 127.0.0.1:27017?

- A. The local MongoDB service or manually started server is not running or is using another port.
- B. The mongosh prompt uses a dark theme.
- C. The database name has underscores.
- D. The user has installed Compass.

**Answer: A.** A client cannot connect if the server is stopped, unreachable, or listening on a different address or port.

### 16. What must generally be configured before a client can connect to an Atlas deployment?

- A. A deployment URI, a database user, and permitted client network access
- B. A local C:\data\db folder only
- C. A Windows service named MongoDB
- D. A public GitHub repository

**Answer: A.** Atlas connection setup involves a connection URI, database credentials, and network access rules.

### 17. Is an Atlas website account the same as a MongoDB database user?

- A. Yes, they are always the same account.
- B. No. The Atlas account and database user serve different purposes.
- C. Yes, if Compass is installed.
- D. No, because Atlas has no database users.

**Answer: B.** Use a database user in the connection URI; do not assume your Atlas website login is that user.

### 18. What can happen if a password contains a reserved URI character such as @?

- A. The character may need to be percent encoded in the connection URI.
- B. MongoDB automatically changes the password.
- C. The server switches to port 80.
- D. The password becomes an ObjectId.

**Answer: A.** Reserved characters can change how a URI is parsed, so encode them as required by the URI format.

### 19. What is the safer default for a local learning server's network binding?

- A. Accept local connections only until remote access is deliberately secured.
- B. Listen on every public network interface with no authentication.
- C. Disable the server's data directory.
- D. Open port 27017 to every internet address.

**Answer: A.** Keeping a learning server local reduces exposure. Remote access requires appropriate authentication and network protections.

### 20. An Atlas connection times out. Which check is most relevant?

- A. Confirm the client's IP is allowed and verify the deployment host in the URI.
- B. Add a description field to every document.
- C. Reinstall MongoDB Compass's theme.
- D. Change every ObjectId to a string.

**Answer: A.** Atlas network access and the URI hostname are common causes of timeouts.

## Short-answer questions

### 1. What is the role of mongod?

**Answer:** It is the MongoDB server process. It stores database files and handles requests from clients.

### 2. What is the role of mongosh?

**Answer:** It is an interactive command-line client used to connect to MongoDB, run commands, and inspect data.

### 3. How is Compass different from the server?

**Answer:** Compass is an optional graphical client. It connects to a server but is not itself the database server.

### 4. What is an application driver?

**Answer:** A driver is a programming library that lets application code connect to MongoDB and perform database operations. For example, a Node.js application uses the MongoDB Node.js driver.

### 5. Why might installing MongoDB Community not make the mongosh command available?

**Answer:** The server installer may not include the separately distributed shell. Install mongosh, make sure its executable directory is on PATH, and open a new terminal.

### 6. What are two ways to run MongoDB Community locally on Windows?

**Answer:** Install it as a Windows service and manage it through Services, or run mongod manually with a data directory.

### 7. What is the purpose of --dbpath?

**Answer:** It tells a manually started mongod process which directory to use for database files. The directory must exist or be creatable and writable by that process.

### 8. Why should a manually started MongoDB process keep its terminal open?

**Answer:** The foreground mongod process runs while that terminal session remains active. Closing or stopping it shuts down that process.

### 9. Why should two MongoDB processes not use the same data directory at the same time?

**Answer:** A data directory is intended to be used by one MongoDB server process at a time. Concurrent use can interfere with database files.

### 10. What does the URI mongodb://127.0.0.1:27017 identify?

**Answer:** It identifies a MongoDB server at the local loopback address, using the default port 27017.

### 11. What does a successful ping command tell you?

**Answer:** It tells you that the client reached the server and that the server handled a command. It does not prove that every collection or application permission is configured.

### 12. Does selecting a database in mongosh always create it immediately?

**Answer:** No. Selecting the name changes the shell's current context. Database data is normally persisted after a write creates it.

### 13. What is the basic difference between a local Community deployment and Atlas?

**Answer:** Community runs on infrastructure you manage, such as your computer. Atlas is a managed cloud deployment operated by MongoDB, while you still configure database users and client access.

### 14. What three items should you check for an Atlas client connection?

**Answer:** The deployment's connection URI, a database user with suitable permissions, and a network access rule that allows the client machine.

### 15. Why should an Atlas URI containing a password be kept private?

**Answer:** Anyone with valid credentials and network access may be able to authenticate. Keep the URI out of committed source files, screenshots, public chats, and other exposed places.

### 16. How should a learner respond if a local connection is refused?

**Answer:** Check that the server service or manual process is running, confirm the port and host, and compare them with the connection URI.

### 17. What is a likely cause if Atlas times out but the URI looks correct?

**Answer:** The client's current IP address may not be permitted in Atlas network access, or the network may block the connection.

### 18. Why should a learner keep the local server bound to loopback while practicing?

**Answer:** It keeps the database available to clients on the same machine without exposing it to other computers. Remote connections should only be enabled after securing authentication and network access.

## Review checklist

You are ready to move on when you can:

- Distinguish the MongoDB server, shell, Compass, and application driver.
- Explain why the server and shell may require separate installation steps.
- Start or check a local Windows MongoDB service.
- Start a manual server with a data directory when no service is configured.
- Connect to the local host and verify the server with a ping command.
- Explain the difference between local Community and Atlas.
- Identify the URI, user, and network access needed for Atlas.
- Troubleshoot a missing command, stopped process, refused connection, timeout, and authentication failure.
- Keep credentials private and avoid exposing a learning database publicly.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [017 - BSON, ObjectId, and document shape](../lessons/017-bson-objectid-and-document-shape.md) | [Lesson](../lessons/018-install-run-and-connect-to-mongodb.md) | Q&A | [Example](../examples/018-install-run-and-connect-to-mongodb.md) | [019 - MongoDB Node.js driver and connection lifecycle](../lessons/019-mongodb-node-js-driver-and-connection-lifecycle.md) |
