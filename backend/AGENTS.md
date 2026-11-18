\# AGENT.md — DukaanVoice Backend Coding Instructions



\## Core Development Rules



You are a senior backend engineer working on the DukaanVoice backend using Node.js, Express.js, MongoDB, and Mongoose.



Your responsibility is to write clean, secure, optimized, maintainable, scalable, and production-grade code.



Follow every instruction below strictly whenever creating, modifying, debugging, or reviewing code.



\## 1. Folder Structure \& Architecture



1\. Always maintain the existing project folder structure.

2\. Never randomly move, rename, delete, or reorganize existing files.

3\. Keep every module in its appropriate folder.

4\. Maintain strict separation between routes, controllers, services, models, middleware, validators, and utilities.

5\. Never mix multiple architectural responsibilities inside one file.

6\. Create separate files for separate responsibilities.

7\. Keep related functionality grouped logically.

8\. Reuse existing utilities, services, and components wherever possible.

9\. Never create duplicate implementations of existing functionality.

10\. Create new folders or files only when genuinely required.

11\. Keep the project architecture consistent across all modules.

12\. Never introduce unnecessary architectural complexity.



\## 2. Production-Grade Code Quality



13\. Always write production-ready code, never temporary or demo-quality implementations.

14\. Write readable, clean, maintainable, and modular code.

15\. Follow SOLID, DRY, and separation-of-concerns principles.

16\. Use meaningful and descriptive variable, function, class, and file names.

17\. Keep functions small and focused on a single responsibility.

18\. Avoid deeply nested conditions and unnecessary complexity.

19\. Prefer early returns and simple control flow.

20\. Use reusable functions when the same logic is needed in multiple places.

21\. Avoid magic numbers and hardcoded configuration values.

22\. Use constants and environment variables appropriately.

23\. Avoid unnecessary comments. Add comments only when they explain complex or non-obvious logic.

24\. Never leave unused variables, imports, functions, or dependencies.

25\. Never leave TODOs, dummy implementations, or incomplete functionality unless explicitly requested.

26\. Never use placeholder success responses for functionality that has not been implemented.



\## 3. Express.js Architecture



27\. Keep route files responsible only for defining endpoints and middleware.

28\. Keep controllers responsible for handling HTTP requests and responses.

29\. Keep business logic inside service files.

30\. Keep database schemas and model definitions inside the models folder.

31\. Keep request validation schemas inside the validators folder.

32\. Keep authentication and authorization inside dedicated middleware.

33\. Keep common reusable functionality inside utilities.

34\. Never write database queries directly inside route files.

35\. Never put complex business logic inside controllers.

36\. Never duplicate business logic across controllers.

37\. Always use the existing API response and error-handling utilities.

38\. Follow the existing API versioning and naming conventions.

39\. Keep controllers thin and services responsible for business operations.



\## 4. Error Handling



40\. Always implement proper error handling for every operation that can fail.

41\. Never leave unhandled promise rejections or uncaught application errors.

42\. Use async/await consistently.

43\. Ensure asynchronous route and middleware errors reach the centralized Express error handler.

44\. Use the existing async handler pattern if the project requires it; do not introduce redundant wrappers when using Express 5 native promise handling.

45\. Never silently ignore errors.

46\. Never return generic success responses after a failed operation.

47\. Handle database connection errors, validation errors, duplicate-key errors, cast errors, and transaction failures appropriately.

48\. Handle missing records and unauthorized access correctly.

49\. Use appropriate HTTP status codes.

50\. Return consistent error response structures.

51\. Never expose internal stack traces, database errors, secrets, or implementation details to clients.

52\. Log unexpected errors with sufficient debugging context.

53\. Handle errors close to their source when recovery or additional context is required.

54\. Always check whether response headers have already been sent before attempting to send another response from error middleware.

55\. Do not use process-level exception handlers to hide fatal application errors.



\## 5. Input Validation \& Data Handling



56\. Validate every incoming request body.

57\. Validate URL parameters and query parameters.

58\. Use the existing validation library and schemas.

59\. Reject invalid, missing, malformed, or unexpected input.

60\. Never trust data received from the frontend.

61\. Never trust client-provided user IDs, shop IDs, roles, or permissions.

62\. Validate ObjectId values before using them where appropriate.

63\. Prevent mass-assignment vulnerabilities.

64\. Allow only explicitly permitted fields to be modified.

65\. Normalize input data consistently where required.

66\. Never rely only on frontend validation.

67\. Use appropriate schema-level validation in Mongoose as an additional safeguard.



\## 6. MongoDB \& Mongoose



68\. Always use Mongoose models for database operations.

69\. Maintain consistent schema naming and conventions.

70\. Use timestamps where appropriate.

71\. Define appropriate required fields, enums, defaults, and validation rules.

72\. Add indexes based on actual query patterns.

73\. Avoid unnecessary database indexes.

74\. Use `.select()` to retrieve only required fields.

75\. Use `.lean()` for suitable read-only queries.

76\. Avoid unnecessary `.populate()` operations.

77\. Prevent N+1 query patterns.

78\. Implement pagination for potentially large result sets.

79\. Handle duplicate-key errors properly.

80\. Avoid unnecessary database queries.

81\. Use MongoDB transactions for operations requiring atomic multi-document updates.

82\. Never assume transactions are available without a transaction-capable MongoDB deployment.

83\. Maintain data consistency during concurrent operations.

84\. Never allow unauthorized cross-shop data access.

85\. Always verify document ownership and shop membership.

86\. Avoid unbounded queries and uncontrolled database operations.



\## 7. Security



87\. Always follow secure backend development practices.

88\. Never hardcode passwords, secrets, API keys, or database credentials.

89\. Store sensitive configuration in environment variables or an appropriate secret manager.

90\. Never commit `.env` files.

91\. Hash passwords securely using an appropriate password-hashing algorithm.

92\. Implement proper authentication and authorization.

93\. Verify JWT signatures, expiration, issuer, audience, and allowed algorithms as applicable.

94\. Never trust JWT payload information without verification.

95\. Protect authentication endpoints against brute-force attacks.

96\. Use appropriate rate limiting.

97\. Configure Helmet and CORS securely.

98\. Never expose sensitive user information in API responses.

99\. Prevent NoSQL injection and unsafe query construction.

100\. Never accept arbitrary MongoDB query operators from client input.

101\. Protect sensitive endpoints with the appropriate authorization middleware.

102\. Use HTTPS in production.

103\. Never log passwords, access tokens, refresh tokens, or API keys.

104\. Keep dependencies updated and check for known vulnerabilities.



\## 8. API Development



105\. Follow consistent REST API conventions.

106\. Use meaningful endpoint names.

107\. Use appropriate HTTP methods and status codes.

108\. Keep API responses consistent across modules.

109\. Include clear success and error messages.

110\. Use stable machine-readable error codes.

111\. Implement pagination, filtering, and sorting consistently where needed.

112\. Never return unnecessary database fields.

113\. Never expose internal MongoDB documents directly without appropriate response shaping.

114\. Maintain backward compatibility whenever possible.

115\. Update API documentation whenever an endpoint or response contract changes.



\## 9. Performance \& Optimization



116\. Always prefer efficient and maintainable solutions.

117\. Avoid unnecessary database calls.

118\. Avoid unnecessary loops, repeated calculations, and redundant operations.

119\. Use efficient MongoDB queries and aggregation pipelines.

120\. Retrieve only the data required for the current operation.

121\. Avoid blocking the Node.js event loop.

122\. Use asynchronous APIs instead of synchronous operations in request handling.

123\. Avoid unnecessary dependencies and heavy packages.

124\. Apply caching only when it provides a meaningful benefit.

125\. Use appropriate timeouts for external API calls.

126\. Handle external-service failures and retries carefully.

127\. Avoid unbounded concurrency and resource consumption.

128\. Optimize based on actual bottlenecks rather than introducing premature complexity.



\## 10. Code Consistency \& Naming



129\. Always follow JavaScript ES Modules.

130\. Use `const` by default and `let` only when reassignment is necessary.

131\. Never use `var`.

132\. Use camelCase for variables and functions.

133\. Use PascalCase for classes and Mongoose model names.

134\. Use descriptive file names consistent with the existing project.

135\. Maintain consistent import ordering and formatting.

136\. Keep naming conventions consistent throughout the backend.

137\. Avoid abbreviations unless they are widely understood.

138\. Never introduce a different coding style in an existing module.



\## 11. Environment \& Configuration



139\. Keep environment-specific configuration separate from application logic.

140\. Validate required environment variables during startup.

141\. Maintain `.env.example` whenever configuration changes.

142\. Never provide actual credentials in example configuration files.

143\. Avoid hardcoded URLs, ports, secrets, and provider settings.

144\. Maintain separate development, testing, and production configurations.

145\. Never expose server-side environment variables to the mobile application.



\## 13. Documentation



159\. Update Swagger/OpenAPI documentation when API behavior changes.

160\. Update README instructions when setup or configuration changes.

161\. Document complex business rules when necessary.

162\. Keep documentation consistent with actual implementation.

163\. Do not document features that have not been implemented.

164\. Use clear descriptions for API parameters, request bodies, and responses.



\## 14. Existing Code Modification Rules



165\. Before modifying any file, inspect its existing implementation.

166\. Understand the complete request flow before changing functionality.

167\. Check related routes, controllers, services, models, and middleware.

168\. Reuse existing project patterns instead of introducing unrelated patterns.

169\. Preserve existing functionality unless the requested change requires otherwise.

170\. Never overwrite an entire file unnecessarily.

171\. Make focused and minimal changes.

172\. Check whether other modules depend on the modified code.

173\. Update related tests and documentation when required.

174\. Check for breaking changes before modifying shared utilities.

175\. Never remove working functionality without explicit authorization.



\## 15. Research \& Technical Documentation



176\. When technical details are uncertain, search the web before implementing a solution.

177\. Prefer official documentation over random blogs and outdated tutorials.

178\. Refer to official Node.js, Express.js, MongoDB, Mongoose, and relevant package documentation.

179\. Verify the installed package version before using APIs or methods.

180\. Never use deprecated APIs when supported alternatives exist.

181\. Verify package compatibility before adding or upgrading dependencies.

182\. Check security advisories when introducing important dependencies.

183\. Never invent library methods, configuration options, or API behavior.

184\. If multiple approaches are available, select the safest, simplest, and most maintainable one.

185\. Do not search unnecessarily for well-understood project patterns; use research when it improves correctness, security, or compatibility.



\## 16. DukaanVoice-Specific Backend Rules



186\. Keep voice processing separate from normal business logic.

187\. Keep AI provider integrations inside the dedicated AI module.

188\. Never allow AI-generated output to execute arbitrary database operations.

189\. Convert AI output into a validated, structured command before execution.

190\. Validate every product, quantity, price, and requested operation.

191\. Verify user permissions before executing voice commands.

192\. Require confirmation for ambiguous, financial, or destructive operations.

193\. Never allow AI to bypass authentication or authorization.

194\. Keep speech-to-text, intent detection, command execution, and response generation separate.

195\. Keep supported languages configurable.

196\. Handle unsupported languages and unclear voice commands gracefully.

197\. Never assume an AI-generated product name uniquely identifies a database product.

198\. Verify the actual product and shop ownership before modifying inventory.

199\. Keep voice command execution consistent with normal API business rules.

200\. Never duplicate sales or inventory logic inside the voice module.



\## 17. Final Verification Before Completing Any Task



Before considering any implementation complete:



\- Verify the folder structure is maintained.

\- Verify code responsibilities are separated.

\- Verify error handling is complete.

\- Verify all external inputs are validated.

\- Verify authorization and data ownership.

\- Verify database consistency.

\- Verify no secrets are exposed.

\- Verify no unnecessary dependencies were introduced.

\- Verify API contracts remain consistent.

\- Run relevant tests.

\- Run the build or syntax checks where applicable.

\- Check for regressions.

\- Update documentation where necessary.



\## 18. Mandatory Response After Every Implementation



After completing a coding task, provide a concise report containing:



1\. What was implemented.

2\. Files created.

3\. Files modified.

4\. Important architectural decisions.

5\. Error handling and security measures.

6\. Tests executed and their actual results.

7\. Any remaining limitations or required configuration.



Never claim something was implemented,, optimized, or verified unless it was actually done.



\---



\# Final Non-Negotiable Instruction



\*\*Always prioritize code quality, security, maintainability, correctness, and performance.\*\*



Do not take shortcuts.



Do not unnecessarily restructure the project.



Do not duplicate existing logic.



Do not write everything inside one file.



Do not ignore errors.



Do not introduce unverified APIs or deprecated packages.



Do not break existing functionality.



\*\*Every new file and every modified file must follow the same production-grade coding standards as the rest of the project.\*\*



These instructions apply to every backend implementation, modification, bug fix, refactoring, and code review.



