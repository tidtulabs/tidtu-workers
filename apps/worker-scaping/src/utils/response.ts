import { Context } from "hono";

export const sendSuccessResponse = (
	c: Context,
	message: string,
	data: any,
	meta?: object,
) => {
	c.status(200);
	const response: any = {
		success: true,
		message,
		response: {
			data,
		},
	};

	if (meta) {
		response.meta = meta;
	}
	return c.json(response);
};

//  errror
export const sendErrorResponse = (
	c: Context,
	message: string,
	error: any = null,
) => {
	c.status(500);
	return c.json({
		success: false,
		message,
		error,
	});
};

export const sendNotFoundResponse = (c: Context, message: string) => {
	c.status(404);
	return c.json({
		success: false,
		message,
		data: null,
	});
};

export const sendBadRequestResponse = (c: Context, message: string) => {
	c.status(400);
	return c.json({
		success: false,
		message,
		data: null,
	});
};
