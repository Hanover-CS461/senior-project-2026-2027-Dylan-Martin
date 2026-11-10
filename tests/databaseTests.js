import { connect, close, removeUser } from "../FRUM/server/database.mjs";

await connect();
console.log(await removeUser("Alice"));
await close();
