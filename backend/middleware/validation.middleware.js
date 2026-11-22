const REQUEST_LOCATIONS = new Set(["body", "params", "query"]);
const MAX_VALIDATION_ISSUES = 50;

export const formatValidationIssues = (issues = []) => {
  const validationIssues = Array.isArray(issues) ? issues : [];
  const fieldErrors = Object.create(null);
  const normalized = [];
  const totalIssues = validationIssues.length;

  for (const issue of validationIssues.slice(0, MAX_VALIDATION_ISSUES)) {
    const path = Array.isArray(issue.path) ? issue.path : [];
    const location = REQUEST_LOCATIONS.has(path[0]) ? path[0] : "request";
    const fieldPath = location === "request" ? path : path.slice(1);
    const field = fieldPath.length ? fieldPath.join(".") : "_form";
    const message = typeof issue.message === "string" ? issue.message : "Invalid value";

    if (!Object.hasOwn(fieldErrors, field)) fieldErrors[field] = [];
    fieldErrors[field].push(message);
    normalized.push({
      field,
      location,
      code: typeof issue.code === "string" ? issue.code : "custom",
      message,
    });
  }

  return {
    fieldErrors,
    issues: normalized,
    totalIssues,
    truncated: totalIssues > normalized.length,
  };
};

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body ?? {},
    params: req.params ?? {},
    query: req.query ?? {},
  });

  if (!result.success) {
    const error = new Error("Request validation failed");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    error.details = formatValidationIssues(result.error.issues);
    return next(error);
  }

  req.body = result.data.body;
  req.params = result.data.params;
  req.validatedQuery = result.data.query;
  next();
};
