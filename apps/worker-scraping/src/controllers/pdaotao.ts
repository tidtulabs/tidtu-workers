import * as response from "utils/response";
import * as services from "services/pdaotao";
import { Context } from "hono";

export const getExamList = async (c: Context) => {
	try {
		const data = await services.fetchExamList(c);
		if (!data) {
			return response.error(c, "Get exam list failed");
		}
		return response.success(
			c,
			"Get exam list successfully",
			data?.data,
			data.meta,
		);
	} catch (err: any) {
    if (err.errorType === "TIMEOUT") {
      return response.timeout(c, err.message);
    }
    return response.serverError(c, err.message);
		// console.log(err);
		// return response.error(c, err.message);
	}
};

export const fetchExamDownloadLink = async (c: Context) => {
	try {
		const url = await services.resolveExamDownloadLink(c);
		if (url) {
			return response.success(c, "Retrieved exam download link successfully", {
				url,
			});
		}

		return response.error(c, "Unable to retrieve exam download link");
	} catch (err: any) {
    if (err.errorType === "TIMEOUT") {
      return response.timeout(c, err.message);
    }
		return response.error(c, err.message);
	}
};
