import { Server } from "socket.io";
import env from "./utils/env";

const io = new Server({});

export default io;