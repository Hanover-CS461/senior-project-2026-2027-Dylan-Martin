import { connect, close, createUser } from "../FRUM/server/database.mjs";

await connect();
await createUser("Alice", null, null);
// await close();
