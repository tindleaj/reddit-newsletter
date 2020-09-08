import { Application } from "https://deno.land/x/oak/mod.ts";
import { Router } from "https://deno.land/x/oak/mod.ts";
import { db } from "./db.ts";
import * as services from "./services.ts";

// Register the dispatcher service worker. We set 'deno' to 'true' to give
// the worker access to the Deno runtime for things like filesystem access,
// since it needs to poll the DB.
const _dispatcher = new Worker(new URL("dispatcher.ts", import.meta.url).href, {
  type: "module",
  deno: true,
});

const app = new Application();
const router = new Router();

router
  .post("/user", services.createUser)
  .get("/user/:id", services.getUser)
  .patch("/user/:id", services.updateUser)
  .post("/user/:id/sub/:name", services.addSub)
  .delete("/user/:id/sub/:name", services.deleteSub);

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 1337 });

db.close();
