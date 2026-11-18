export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const error = new Error("Request validation failed");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    error.details = result.error.flatten().fieldErrors;
    return next(error);
  }

  req.body = result.data.body;
  next();
};
