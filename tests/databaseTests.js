import { connect, close, getUserDoc } from "../FRUM/server/database.mjs";

await connect();
console.log(await getUserDoc('Bob'));
await close();
