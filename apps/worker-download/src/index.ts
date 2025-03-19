import { Hono, HonoRequest } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import router from "routes";
import * as response from "utils/response";

const app = new Hono<{ Bindings: CloudflareBindings }>();


app.use("*", async (c, next) => {
	const corsMiddlewareHandler = cors({
		origin: c.env.CORS_ORIGIN,
    credentials: true,
	});
	return corsMiddlewareHandler(c, next);
});

app.use("*", async (c, next) => {
	const allGetCookie = getCookie(c);
	let deviceId = allGetCookie.deviceId;
	if (!deviceId) {
		console.log("No deviceId");
		deviceId = crypto.randomUUID(); 
		setCookie(c, "deviceId", deviceId, {
			secure: true,
      httpOnly: true,
			path: "/",
			sameSite: "Lax", 
		});
	}

	const { success } = await c.env.MY_RATE_LIMITER.limit({ key: deviceId }); // key can be any string of your choosing
	if (!success) {
		return response.limitExceeded(c, "Rate limit exceeded");
	} else {
		await next();
	}
});

app.route("/api/v1", router);

export default app;
