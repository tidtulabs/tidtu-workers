import { Context } from "hono";
import { ExamItem, getExamList } from "../services/cache-redis";

const Task = async (
	endpoint: string | null,
	data: ExamItem[] = [],
	remainingPages: number = 0,
	includeAll: boolean = false,
) => {
	let nextPagination = "";
	let currentPagination = "";
	let isNew = false;

	const fe = endpoint ? `EXAM_LIST${endpoint}` : "EXAM_LIST";

	const scraping = await getExamList(fe);

	const end = scraping.data[scraping.data.length - 1];
	Array.prototype.push.apply(data, scraping.data);

	if (scraping.nextPagination) {
		if (end.isNew || includeAll)
			return Task(scraping.nextPagination, data, remainingPages, includeAll);
		else {
			if (remainingPages > 0) {
				remainingPages--;
				return Task(scraping.nextPagination, data, remainingPages);
			}
		}
	}

	if (scraping) {
		isNew = end.isNew || false;
		nextPagination = scraping.nextPagination || "";
		currentPagination = endpoint || "";
	}

	return {
		data: data,
		meta: {
			nextPagination: nextPagination,
			currentPagination: currentPagination,
			dateCreated: new Date().toISOString(),
		},
	};
};

export const cachedRedis = async (c: Context) => {
	try {
		const { env } = c;
		await env.CACHE_TIDTU.put("isUpdated", "true", { expirationTtl: 120 });
		const task1 = await Task("", [], 7);
		const task2 = await Task(task1.meta.nextPagination, [], 0, true);
		await env.CACHE_TIDTU.put("examList:frequency", JSON.stringify(task1));
		await env.CACHE_TIDTU.put("examList:total", JSON.stringify(task2));
		await env.CACHE_TIDTU.delete("isUpdated");

		c.status(201);
		return c.json({
			success: true,
			message: "create cache redis successfull",
		});
	} catch (error: any) {
    c.status(500);
    return c.json({
      success: false,
      message: "something went wrong",
    });
	}
};
