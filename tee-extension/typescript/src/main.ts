import { Server } from "./base/server.js";
import { register, reportState } from "./app/handlers.js";
import { Version } from "./app/config.js";

const EXTENSION_PORT = process.env.EXTENSION_PORT || "8883";
const SIGN_PORT = process.env.SIGN_PORT || "8882";

console.log(`[hedsup-tee] Starting invoice factoring TEE extension v${Version}`);
console.log(`[hedsup-tee] Extension port: ${EXTENSION_PORT}, Sign port: ${SIGN_PORT}`);

const srv = new Server(EXTENSION_PORT, SIGN_PORT, Version, register, reportState);
srv.listenAndServe();
