# MERN Projects

A curated collection of complete, polished web projects built with MongoDB, Express, React, and Node.js. Each project is maintained as an independent application with its own documentation, configuration, and run instructions.

## Repository layout

```text
mern_projects/
|-- projects/
|   `-- <project-name>/
|       |-- client/
|       |-- server/
|       |-- .env.example
|       `-- README.md
`-- README.md
```

Projects may use a different folder structure when it better fits their architecture. Their individual README files describe the exact setup and commands.

## Projects

- [mern](projects/mern/)
- [mern2](projects/mern2/)
- [mern-auth](projects/mern-auth/)
- [mern-auth-chakra-frontend](projects/mern-auth-chakra-frontend/) — frontend only
- [mern-auth-crud](projects/mern-auth-crud/)
- [mern-authorization-example](projects/mern-authorization-example/) — source repo empty
- [mern-full-stack-app1](projects/mern-full-stack-app1/)

## Running a project

Choose a project under `projects/` and follow its README. Projects may have separate frontend and backend dependencies, environment variables, databases, and setup commands. Use the supplied `.env.example` as a guide, and keep real credentials in an untracked local environment file.

## Project standards

Each project should provide a complete, usable experience; a responsive and polished interface; clear loading, empty, and error states; validated API inputs; documented environment variables; and practical local run instructions. Keep projects self-contained and avoid depending on undocumented setup elsewhere in the repository.

## Security

Never commit API keys, passwords, tokens, private keys, or production secrets. Review authentication, authorization, input validation, CORS, and database access before deploying a project publicly.

## License

Check each project directory for its license and reuse terms. A project may have terms different from this repository or from other projects in the collection.