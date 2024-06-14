import app from "./utils/app";
import env from "./utils/env";
app.listen(env.port, () => {
  console.log(`[server]: server is running at :${env.port}`);
});