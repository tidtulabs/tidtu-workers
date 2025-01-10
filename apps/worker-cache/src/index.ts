import { Hono } from "hono";
import router from "./routes";

interface Env {
	CACHE_TIDTU: KVNamespace;
}
const app = new Hono<{ Bindings: Env }>();

app.route("/api/v1", router);

app.get("/", async (c) => {
	const v = await c.env.CACHE_TIDTU.get("examList:frequency");
  // console.log(v);
	return c.text(v as string);
});


export default app;

