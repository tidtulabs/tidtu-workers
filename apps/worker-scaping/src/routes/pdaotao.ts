import * as pdaotao from "controllers/pdaotao";
import { Context, Hono } from "hono";
const router = new Hono();

router.get("/scraping/examlist", pdaotao.examList);
router.get("/test", async (c) => {
	// const v = await c.env.CACHE_TIDTU.put("example", "Hello Hono!");
	// console.log(await c.env.CACHE_TIDTU.get("example"));
	return c.text("Hello Hono! test");
});

// router.get("/scraping/examlist/:examId", pdaotao.getExamDownloadLink);

export default router;
