import { connect, close, listUsernames } from "../FRUM/server/database.mjs";

await connect();
await listUsernames();
await close();
