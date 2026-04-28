export const success = (ctx, data, message = "success") =>
	ctx.status(200, {
		code: 0,
		message,
		data,
		timestamp: Date.now(),
	});

export const fail = (ctx, message = "fail", code = 500) =>
	ctx.status(code, {
		code,
		message,
		timestamp: Date.now(),
	});
