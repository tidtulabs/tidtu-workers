import { sendErrorResponse, sendSuccessResponse } from "utils/response";
import { getDataExamList, getLinkDownLoad } from "services/pdaotao";
import { Context } from "hono";

export const examList = async (c: Context) => {
	try {
		const data = await getDataExamList(c);
		if (!data) { 
			return sendErrorResponse(c, "Get exam list failed");
		}
		return sendSuccessResponse(
			c,
			"Get exam list successfully",
			data?.data,
			data.meta,
		);
	} catch (err: any) {
    console.log(err)
		// logger.error(err.message);
		return sendErrorResponse(c, err.message);
	}
};

export const getExamDownloadLink = async (c:Context) => {
	try {
    const { req, res } = c;
		const  examId  = req.param("examId");
		if (!examId) {
			logger.error("Invalid exam ID");
			return sendErrorResponse(res, "Invalid exam ID");
		}
		const cachedUrl = await redis.get(`cached:downloadFile:${examId}`);
		if (cachedUrl) {
			return sendSuccessResponse(
				res,
				"Retrieved exam download link successfully (cached)",
				{
					url: cachedUrl,
				},
			);
		}

		const url = await getLinkDownLoad(`EXAM_LIST_Detail/?ID=${examId}&lang=VN`);

		if (url) {
			await redis.set(`cached:downloadFile:${examId}`, url);
			return sendSuccessResponse(
				res,
				"Retrieved exam download link successfully",
				{
					url,
				},
			);
		}

		return sendErrorResponse(res, "Unable to retrieve exam download link");
	} catch (err: any) {
		logger.error(err.message);
		return sendErrorResponse(res, err.message);
	}
};
