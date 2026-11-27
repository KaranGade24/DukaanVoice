export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;
  let statusCode = error.statusCode || 500;
  let code = error.code || "INTERNAL_SERVER_ERROR";
  let message = statusCode >= 500 ? "Internal server error" : error.message;
  if (error.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    const fields = Object.keys(error.keyPattern || {});
    message = fields.includes("email")
      ? "An account with this email already exists"
      : fields.includes("name")
        ? "A category with this active name already exists"
        : fields.includes("sku")
          ? "A product with this SKU already exists"
          : fields.includes("barcode")
            ? "A product with this barcode already exists"
            : fields.includes("supplierInvoiceNumber")
              ? "This supplier invoice has already been recorded"
              : fields.includes("purchaseReference")
                ? "Purchase reference already exists"
                : fields.includes("idempotencyKey")
                  ? "This request has already been processed"
                  : "A resource with these details already exists";
  }
  if (error.name === "ValidationError") {
    statusCode = 400;
    code = "DATABASE_VALIDATION_ERROR";
    const fields = Object.keys(error.errors || {});
    console.error("Database validation failed", {
      fields,
      errors: fields.map((field) => ({
        field,
        kind: error.errors[field]?.kind || "validation",
      })),
    });
    message = fields.length
      ? `Invalid data in: ${fields.join(", ")}`
      : "Invalid data";
  }

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
};
