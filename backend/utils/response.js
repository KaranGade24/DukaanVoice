export const sendSuccess = (res, status, data) =>
  res.status(status).json({ success: true, data });
