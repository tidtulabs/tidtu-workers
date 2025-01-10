import { Hono } from "hono";
import pdaotaoCached from "./cache-redis";

const router = new Hono();

router.route("/pdaotao/scraping", pdaotaoCached);

export default router;

