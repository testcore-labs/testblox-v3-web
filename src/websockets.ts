import { Server } from "socket.io";
import env from "./utils/env";

const io = new Server({});
const server = io.listen(env.ws.port);

export default server;