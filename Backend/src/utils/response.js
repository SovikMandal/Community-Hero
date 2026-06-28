// Standardized JSON response envelopes.
export function sendSuccess(res, data = null, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendCreated(res, data = null, message = "Created") {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated(res, items, { page, limit, total }, message = "OK") {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
