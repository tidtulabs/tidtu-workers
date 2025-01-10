import { Context } from "hono";
import { scrapingData } from "lib/cheerio";
// import { logger } from "lib/winston";
import { extractEndpoint } from "utils/extract-endpoint";

function parseTitleAndTime(input: string) {
	const parts = input
		.split("\n")
		.map((part) => part.trim())
		.filter((part) => part);

	if (!parts[0] || !parts[1]) {
		return { title: null, time: null };
	}

	return {
		title: parts[0],
		time: parts[1].replace(/[()]/g, ""),
	};
}

export const getFirstRow = async (endpoint: string) => {
	const scraping = await scrapingData(endpoint);

	if (!scraping.success || !scraping.data) {
		throw new Error(scraping.message);
	}

	const $ = scraping.data;
	const firstCell = $(".border_main")
		.find("table")
		.find("tr")
		.first()
		.find("td")
		.eq(2)
		.text();

	return parseTitleAndTime(firstCell);
};

export const getLinkDownLoad = async (endPoint: string) => {
	const scraping = await scrapingData(endPoint);

	if (scraping.success === false) {
		throw new Error(scraping.message);
	}

	if (scraping.data) {
		const $ = scraping.data;
		let urlFile = null;
		const rows = $(".border_main").find("table").find("tr").first().find("td");

		urlFile = $(rows).find("tr").find("a").eq(1).attr("href");

		if (!urlFile) {
			throw new Error("File url not found in the page.");
		}
		return extractEndpoint(urlFile);
	}
};

type ExamItem = {
	examTitle: string; // Tiêu đề bài thi
	examDetailsUrl: string; // Ngày tải lên
	uploadDate: string; // Ngày tải lên
	isNew: boolean; // Cờ đánh dấu bài thi có mới hay không
	pagination: number; //  phân trang hiện tại
	row: number; // Số thứ tự dòng bài thi trong bảng
};

type ExamListResult = {
	data: ExamItem[];
	meta: {
		currentPagination: string;
		nextPagination: string;
	};
};

export const getDataExamList = async (c: Context) => {
	const { req, env } = c;
	// const query = req.query()
	try {
		const isTotalRequested = req.query("total") || false;
		if (isTotalRequested) {
			// const cachedExamList = await redis.get("cached:examList:total");
      const cachedExamList = await env.CACHE_TIDTU.get("examList:total");
			const cachedData: ExamListResult = cachedExamList
				? JSON.parse(cachedExamList)
				: null;
			return {
				data: cachedData.data,
				meta: cachedData.meta,
			};
		}
		const examData = await getFirstRow("EXAM_LIST");
    const cachedExamList =  await env.CACHE_TIDTU.get("examList:frequency");
  // console.log(cachedExamList)

		// const cachedExamList = await redis.get("cached:examList:frequency");

		const cachedData: ExamListResult = cachedExamList
			? JSON.parse(cachedExamList)
			: null;
		if (
			examData.title === cachedData?.data[0]?.examTitle &&
			examData.time === cachedData?.data[0]?.uploadDate
		) {
			return {
				data: cachedData.data,
				meta: cachedData.meta,
			};
		} else {
			// const isUpdated = await redis.get("cached:isUpdated");
      const isUpdated = await env.CACHE_TIDTU.get("isUpdated")
			if (!isUpdated) {
				const URL = `${process.env.CACHE_SERVICE_API}/api/v1/pdaotao/scraping/cache`;
				fetch(URL, {
					method: "PUT",
				})
					.then((response) => {
						//console.log("Success:", response);
					})
					.catch((error) => {
						//console.error("Error occurred:", error);
					});
			}
			return {
				data: cachedData.data,
				meta: cachedData.meta,
			};
		}
	} catch (error: any) {
		// logger.error(error.message);
		return null;
	}
};
