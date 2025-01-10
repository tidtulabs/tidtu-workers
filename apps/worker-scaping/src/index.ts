import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "routes";

const app = new Hono<{ Bindings: CloudflareBindings }>();


app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN,
  })
  return corsMiddlewareHandler(c, next)
})



app.route("/api/v1", router);
// app.get("/", async (c) => {
// 	// const v = await c.env.CACHE_TIDTU.put("example", "Hello Hono!");
// 	const t = await c.env.CACHE_TIDTU.get("examList:frequency");
// 	return c.text(t as string);
// });

export default app;
