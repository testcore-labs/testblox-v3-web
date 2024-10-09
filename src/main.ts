import env from "./utils/env";
process.env.TZ = env.timezone;

import './sql';
import http from "./http";
import arbiter from "./arbiter";

arbiter.init();
http.init();