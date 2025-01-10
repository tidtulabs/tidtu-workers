import { Hono } from "hono";
import * as pdaotao from "../controllers/cache-redis";
const router = new Hono();

router.put("/cache", pdaotao.cachedRedis);

export default router;
