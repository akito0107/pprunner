import * as Koa from "koa";
import * as Router from "koa-router";
import * as nextjs from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
// @ts-ignore
const app = nextjs({ dev });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();
  // @ts-ignore
  const server = new Koa();
  // @ts-ignore
  const router = new Router();

  router.get("/_kill", async ctx => {
    ctx.body = { ok: "shutdown" };
    setTimeout(() => {
      process.exit(0);
    }, 500);
  });

  router.get("*", async ctx => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
  });

  server.use(async (ctx, next) => {
    ctx.res.statusCode = 200;
    await next();
  });
  server.use(router.routes());

  server.listen(port);
}

main();
