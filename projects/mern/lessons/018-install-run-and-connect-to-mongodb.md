# 018 - Install, Run, and Connect to MongoDB

## Learning goals

By the end of this lesson, you should be able to:

- Tell the MongoDB server, MongoDB Shell, Compass, and application driver apart.
- Choose between a local MongoDB Community deployment and a managed Atlas deployment for practice.
- Install MongoDB Community and the standalone shell on Windows.
- Start or check the local MongoDB service.
- Connect to a local server with a MongoDB connection string.
- Confirm a connection with a ping command.
- Identify common connection failures without exposing credentials or opening an unsecured database to the internet.

## The parts you use

MongoDB work involves a server and one or more clients:

| Part | What it does |
| --- | --- |
| MongoDB Server (`mongod`) | Runs the database process, stores data, and accepts database requests |
| MongoDB Shell (`mongosh`) | An interactive command-line client for connecting to and working with a MongoDB deployment |
| MongoDB Compass | An optional graphical client for viewing and working with a deployment |
| MongoDB driver | A library your application uses to communicate with MongoDB; the Node.js driver is introduced in chapter 019 |

Installing the server does not necessarily install every client. In particular, the MongoDB Shell is distributed separately from MongoDB Server. An installed Compass application is also a client; it does not mean that a local database server is running.

## Choose where MongoDB will run

There are two practical learning options:

### Local Community deployment

MongoDB Community runs on your own computer. You control the server process and local data files. This is useful for learning server and shell basics without depending on a cloud connection.

### Managed Atlas deployment

MongoDB Atlas runs the database in MongoDB's cloud service. You do not install or manage the database server process on your computer. You do need a database user and network access configured for the client you use.

The shell can connect to either kind of deployment. The connection string and security setup differ. Do not treat your Atlas account login as a database user's credentials; they are separate accounts.

## Install MongoDB Community on Windows

Use the official MongoDB Community installer for a MongoDB version supported by your Windows version and computer architecture. Installation screens can change between releases, so read the displayed options before continuing.

A typical beginner setup is:

1. Download the Windows installer for MongoDB Community.
2. Run the installer and choose the Complete setup unless you have a reason to customize it.
3. Choose whether the installer should configure MongoDB Server as a Windows service. For a personal learning machine, using the service makes starting the server easier.
4. Note the installation, data, and log locations shown in the installer. The configuration file is installed with the server and controls settings such as storage paths and network binding.
5. Install Compass if you want a graphical client; it is optional.
6. Complete the installation.

When configured as a Windows service, the service normally starts at the end of installation. You can inspect or start it later in the Windows Services application. The default service name is commonly `MongoDB`; a customized installation can use another name.

The installer may add the server executable directory to `PATH`, but a terminal that was already open may not pick up a changed `PATH`. Open a new terminal before checking commands.

## Install MongoDB Shell separately

Install the MongoDB Shell (`mongosh`) for Windows as a separate tool. During installation, add the shell's executable directory to `PATH` if the installer offers that option. Open a new terminal afterwards.

Check that the commands are available:

~~~powershell
mongod --version
mongosh --version
~~~

`mongod` reports the server version. `mongosh` reports the shell version. If Windows says a command is not recognized, confirm that the corresponding program is installed, check its executable directory, and reopen the terminal after changing `PATH`.

## Start and check the local server

If you chose the MongoDB Windows service during installation, check it in the Services application:

1. Open the Start menu and search for **Services**.
2. Find the MongoDB service, commonly named `MongoDB`.
3. Confirm its status is **Running**.
4. If it is stopped, start it. Windows may ask for administrator approval.

PowerShell can also inspect the service:

~~~powershell
Get-Service MongoDB
~~~

If the service was not installed, you can run the server manually. First create a data directory, then start `mongod` with that directory:

~~~powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\mongodb-data" -Force
mongod --dbpath "$env:USERPROFILE\mongodb-data"
~~~

The executable must be on `PATH`; otherwise, run it by its full installation path. Keep this terminal open while the server is running. The server process writes its data under the directory passed to `--dbpath`. Stop a manually started server with `Ctrl+C` and wait for it to shut down before closing the terminal.

Do not start a second `mongod` against a data directory that is already in use by the Windows service. Only one server process should own a given data directory at a time.

## Connect to a local deployment

MongoDB listens on port `27017` by default for a local deployment. Connect with the shell using the loopback address:

~~~powershell
mongosh "mongodb://127.0.0.1:27017"
~~~

`127.0.0.1` means this computer. It avoids depending on how the word `localhost` resolves on a particular machine. The connection string identifies the server host and port.

When the connection succeeds, `mongosh` shows an interactive prompt. Check that the server responds:

~~~javascript
db.runCommand({ ping: 1 })
~~~

A successful response contains an `ok` value of `1`. This confirms that the shell reached the server and the server handled the command.

You can inspect the current database name:

~~~javascript
db.getName()
~~~

The shell starts with a default database context. Selecting another database with `use databaseName` changes the current context; it does not necessarily create stored database data. A database is normally stored after data is written to it.

Leave the shell with:

~~~javascript
exit
~~~

## Connect the shell to Atlas

To use a managed Atlas deployment, first create or select a deployment in the Atlas interface. Configure these items before connecting:

1. Create a database user with a strong password and only the permissions needed for your learning work.
2. Add the IP address of the computer running the client to the deployment's network access list.
3. In the Atlas connection flow, select the shell option and copy the connection string it provides.
4. Replace the password placeholder with the database user's password, then pass the completed URI to `mongosh`.

The URI has a shape similar to this:

~~~text
mongodb+srv://<db_user>:<db_password>@<cluster-host>/?retryWrites=true&w=majority
~~~

Use the URI generated for your own deployment. Do not paste real credentials into a public file, chat, screenshot, shell history, or source control. If a username or password contains reserved URI characters such as `@`, `/`, `?`, `#`, or `:`, encode those characters as required by the connection URI format.

A network access rule only permits a network location to attempt a connection. It does not create a database user or grant that user permissions. Keep both the network rule and database-user permissions limited to what you need.

## Local connection versus Atlas connection

| Detail | Local Community | Atlas |
| --- | --- | --- |
| Server process | Runs on your computer | Runs as a managed cloud deployment |
| Typical shell target | `mongodb://127.0.0.1:27017` | URI copied from the deployment's connect flow |
| Network access | Local client connects through loopback by default | Client's network address must be allowed |
| Database credentials | Not necessarily required for a fresh local learning install | Database user credentials are required when configured |
| Operational responsibility | You start, stop, and maintain the local server and data | MongoDB manages the hosted server; you manage access and credentials |

This chapter uses a local deployment in its example. The command-line shell flow is similar for Atlas, but use the URI and access settings for the Atlas deployment.

## Keep a learning deployment private

A fresh local learning server normally listens only on the local machine. Keep that default while learning. Do not change the network binding to accept connections from every interface or expose port `27017` publicly just to make a connection work.

Before a self-managed deployment accepts remote connections, configure authentication and appropriate network protections. For Atlas, use a narrow network access list and a database user with suitable privileges. Never put a database password in a committed source file.

## Common connection problems

| Symptom | What to check |
| --- | --- |
| `mongosh` is not recognized | Install the shell, add its executable directory to `PATH`, and open a new terminal |
| `mongod` is not recognized | Install the server or run its executable using the installation path |
| Connection refused on `127.0.0.1:27017` | Check that the local service or manually started server is running and listening on that port |
| Connection works locally but not from another computer | The server may be bound to loopback only; keep that secure default unless remote access is intentionally configured |
| Atlas connection times out | Check the client's IP in the network access list, the hostname in the URI, and outbound network access |
| Atlas reports authentication failure | Check the database username and password, the URI, and whether special characters were encoded |
| A command works in the shell but not in Compass | Confirm Compass uses the same deployment URI and credentials |

Read the error carefully before changing server or firewall settings. A connection problem is not a reason to expose a database to the public internet.

## Lesson summary

- `mongod` is the database server; `mongosh` is a separate shell client.
- Compass is optional, and the Node.js driver connects from an application.
- On Windows, Community can run as a service or as a manually started process.
- A local shell URI commonly targets `127.0.0.1:27017`.
- A ping command confirms that a client can reach and use the server.
- Atlas requires a database user, a permitted client network address, and the deployment's connection URI.
- Keep credentials private and keep a learning server local unless remote access is deliberately secured.

## Review checklist

You are ready to move on when you can:

- Explain the difference between `mongod`, `mongosh`, Compass, and a driver.
- Check whether the MongoDB server and shell are installed.
- Start or inspect the local Windows service.
- Connect to the local server and confirm it with a ping.
- Explain what a connection URI identifies.
- Describe the extra Atlas access settings needed by a client.
- Troubleshoot a missing command, a stopped server, an incorrect URI, and an Atlas access problem.
- Explain why a learning database should not be exposed to the public internet.

---

### Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| :--- | :--- | :--- | :--- | :---: |
| [017 - BSON, ObjectId, and document shape](017-bson-objectid-and-document-shape.md) | Lesson | [Q&A](../qnas/018-install-run-and-connect-to-mongodb.md) | [Example](../examples/018-install-run-and-connect-to-mongodb.md) | [019 - MongoDB Node.js driver and connection lifecycle](019-mongodb-node-js-driver-and-connection-lifecycle.md) |
