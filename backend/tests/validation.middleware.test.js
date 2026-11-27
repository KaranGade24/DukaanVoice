import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  formatValidationIssues,
  validate,
} from "../middleware/validation.middleware.js";

test("formats body, nested, query, and root validation issues with field errors", () => {
  const result = formatValidationIssues([
    {
      path: ["body", "supplierName"],
      code: "too_small",
      message: "Supplier name is required",
    },
    {
      path: ["body", "address", "city"],
      code: "invalid_type",
      message: "Expected string",
    },
    { path: ["query", "limit"], code: "too_big", message: "Limit is too high" },
    { path: [], code: "custom", message: "Request is invalid" },
  ]);

  assert.deepEqual(Object.fromEntries(Object.entries(result.fieldErrors)), {
    supplierName: ["Supplier name is required"],
    "address.city": ["Expected string"],
    limit: ["Limit is too high"],
    _form: ["Request is invalid"],
  });
  assert.deepEqual(
    result.issues.map(({ field, location, code }) => ({
      field,
      location,
      code,
    })),
    [
      { field: "supplierName", location: "body", code: "too_small" },
      { field: "address.city", location: "body", code: "invalid_type" },
      { field: "limit", location: "query", code: "too_big" },
      { field: "_form", location: "request", code: "custom" },
    ],
  );
  assert.equal(result.truncated, false);
  assert.equal(result.totalIssues, 4);
});

test("keeps multiple messages per field and caps large error payloads", () => {
  const issues = Array.from({ length: 60 }, (_, index) => ({
    path: ["params", "id"],
    code: "custom",
    message: `Invalid identifier ${index}`,
  }));
  const result = formatValidationIssues(issues);

  assert.equal(result.fieldErrors.id.length, 50);
  assert.equal(result.issues.length, 50);
  assert.equal(result.totalIssues, 60);
  assert.equal(result.truncated, true);
  assert.equal(JSON.stringify(result).includes("submitted-value"), false);
});

test("keeps unusual submitted field names as ordinary validation keys", () => {
  const result = formatValidationIssues([
    {
      path: ["body", "__proto__"],
      code: "unrecognized_keys",
      message: "Unknown field",
    },
  ]);

  assert.equal(Object.hasOwn(result.fieldErrors, "__proto__"), true);
  assert.deepEqual(result.fieldErrors.__proto__, ["Unknown field"]);
  assert.equal(
    JSON.parse(JSON.stringify(result)).fieldErrors.__proto__[0],
    "Unknown field",
  );
});

test("validation middleware returns detailed, safe route validation errors", () => {
  const schema = z.object({
    body: z.object({ quantity: z.number() }).strict(),
    params: z.object({}),
    query: z.object({ limit: z.coerce.number().int().min(1) }).strict(),
  });
  const request = {
    body: { quantity: "not-a-number" },
    params: {},
    query: { limit: "0" },
  };
  let validationError;

  validate(schema)(request, {}, (error) => {
    validationError = error;
  });

  assert.equal(validationError.statusCode, 400);
  assert.equal(validationError.code, "VALIDATION_ERROR");
  assert.deepEqual(Object.keys(validationError.details.fieldErrors).sort(), [
    "limit",
    "quantity",
  ]);
  assert.equal(validationError.details.issues[0].location, "body");
  assert.equal(validationError.details.issues[1].location, "query");
  assert.equal(
    JSON.stringify(validationError.details).includes("not-a-number"),
    false,
  );
});

test("validation middleware exposes sanitized route params to controllers", () => {
  const schema = z.object({
    body: z.object({}).strict(),
    params: z.object({ saleId: z.string().trim() }).strict(),
    query: z.object({}).strict(),
  });
  const request = { body: {}, params: { saleId: " sale-id " }, query: {} };
  let validationError;

  validate(schema)(request, {}, (error) => {
    validationError = error;
  });

  assert.equal(validationError, undefined);
  assert.deepEqual(request.validatedParams, { saleId: "sale-id" });
  assert.deepEqual(request.params, { saleId: "sale-id" });
});
