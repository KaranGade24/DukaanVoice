\# AGENTS.md — DukaanVoice Master Full-Stack Development Instructions



\## 1. Project Overview



DukaanVoice is a production-oriented, multilingual shop-management application.



The project contains two connected applications:



\- \*\*Mobile Frontend:\*\* React Native + Expo + NativeWind.

\- \*\*Backend:\*\* Node.js + Express.js + MongoDB + Mongoose.



The mobile application communicates with the backend through APIs.



Both applications form one complete system. Codex must understand, inspect, and maintain the integration between them.



\## 2. Full-Stack Access \& Modification Permission



1\. You have permission to inspect and modify both the `mobile/` and `backend/` directories.

2\. Do not restrict your work to the directory where the user's request originated.

3\. When a feature requires changes in both applications, modify both applications.

4\. When a mobile feature requires missing backend functionality, implement that functionality in the backend first.

5\. When a backend change requires mobile updates, update the mobile application accordingly.

6\. Never assume that an existing frontend feature has a working backend implementation.

7\. Never assume that an existing backend endpoint is correctly integrated into mobile.

8\. Inspect actual source code, routes, models, services, components, and API calls before making decisions.

9\. Preserve the existing architecture and working functionality.

10\. Never leave required frontend or backend integration incomplete.

11\. Do not ask the user for permission to make ordinary, necessary changes in either application.

12\. Ask for confirmation only before destructive operations, major architectural migrations, data deletion, or actions with significant external consequences.



\## 3. Mandatory Frontend–Backend Development Rule



\*\*Backend is the source of truth for business logic, authorization, validation, and persistent data.\*\*



Whenever implementing a feature:



1\. First understand the complete requirement.

2\. Inspect the mobile implementation.

3\. Inspect the backend implementation.

4\. Identify missing functionality on either side.

5\. Determine the complete implementation required.

6\. Implement missing backend functionality first whenever mobile depends on it.

7\. Verify backend API behavior.

8\. Integrate the backend API into mobile.

9\. Update mobile screens and user interactions.

10\. Verify the complete feature across both applications.



Never implement fake frontend functionality to compensate for missing backend functionality.



Never use hardcoded sample data as a replacement for actual backend integration in a completed feature.



\## 4. Backend-First Implementation Workflow



When the user requests a mobile feature that requires backend support, follow this exact workflow.



\### Step 1: Inspect the existing backend



Check:



\- Existing MongoDB models and schemas.

\- Existing routes and API endpoints.

\- Controllers and services.

\- Authentication and authorization middleware.

\- Validation schemas.

\- Existing business logic.

\- Database relationships and ownership rules.

\- Error-handling utilities.

\- API documentation.



Do not create duplicate models, routes, or services.



\### Step 2: Identify missing backend functionality



Determine whether the backend already supports:



\- Required data fields.

\- Required database operations.

\- Create, read, update, and delete operations.

\- Business rules and calculations.

\- Authentication and authorization.

\- Input validation.

\- Required API responses.

\- Pagination, filtering, and sorting where applicable.

\- Error handling and security.



If anything essential is missing, implement it before integrating the mobile feature.



\### Step 3: Implement backend changes first



Follow `backend/AGENTS.md`.



\- Update existing Mongoose models or create new ones when required.

\- Add required validation.

\- Implement missing service logic.

\- Add or update controllers.

\- Add or update API routes.

\- Apply authentication and authorization.

\- Handle database operations and errors.

\- Update API documentation.

\- Maintain backward compatibility where possible.



\### Step 4: Verify backend functionality



Before connecting mobile:



\- Check that the endpoint exists.

\- Check the HTTP method and URL.

\- Check required request parameters and body.

\- Check validation behavior.

\- Check authentication and authorization.

\- Check database operations.

\- Check successful response structures.

\- Check error response structures.

\- Run relevant backend tests.



Do not proceed as if the backend is complete when essential backend behavior is still missing.



\### Step 5: Integrate mobile



Follow `mobile/AGENTS.md`.



\- Create or update mobile API service functions.

\- Use the actual backend endpoint.

\- Match request payloads to backend validation.

\- Match frontend data handling to backend responses.

\- Implement loading, success, empty, and error states.

\- Update React Context state when shared application state is affected.

\- Update screens and reusable components.

\- Preserve the existing NativeWind design system.

\- Handle authentication and network errors correctly.



\### Step 6: Verify complete integration



Test the entire flow:



\*\*User action → Mobile screen → Mobile service → Backend API → Validation → Controller → Service → MongoDB → Backend response → Mobile state → Updated UI.\*\*



Do not consider the feature complete until the full flow has been verified as far as the available environment permits.



\## 5. Backend-Driven Mobile Updates



When backend functionality, API contracts, or database structures change:



1\. Inspect every mobile service using the affected endpoint.

2\. Find every screen and component depending on the affected data.

3\. Update request payloads and response handling.

4\. Update mobile models, constants, and data mapping where necessary.

5\. Update form fields and validation where necessary.

6\. Update UI components when new backend fields or behaviors require it.

7\. Update state management when data structures change.

8\. Handle removed, renamed, optional, or newly required fields.

9\. Check all dependent screens for regressions.

10\. Verify that no old API assumptions remain.



Never update the backend while leaving the mobile application using an outdated contract.



\## 6. API Contract Synchronization



The frontend and backend must always agree on their API contracts.



For every API, identify:



\- HTTP method.

\- Endpoint path.

\- Authentication requirements.

\- Request headers.

\- Query parameters.

\- Request body.

\- Validation rules.

\- Success response.

\- Error response.

\- HTTP status codes.



Rules:



1\. Use the backend's actual API implementation as the source of truth.

2\. Keep mobile API service functions synchronized with backend routes.

3\. Keep property names and data types consistent.

4\. Do not invent API endpoints.

5\. Do not assume response structures without inspecting backend code.

6\. Handle nullable and optional fields safely.

7\. Update both applications when an API contract changes.

8\. Avoid breaking existing clients unnecessarily.

9\. Update Swagger or the existing API documentation.

10\. Reuse existing API clients and response utilities.



If an API contract is missing, define and implement it in the backend before integrating it into mobile.



\## 7. Database \& Business Logic Rules



1\. MongoDB and Mongoose are managed exclusively by the backend.

2\. Never connect directly to MongoDB from React Native.

3\. Keep database queries inside appropriate backend service or data-access modules.

4\. Validate all incoming data on the backend.

5\. Keep important business rules on the backend.

6\. Enforce shop ownership and user authorization.

7\. Never trust user IDs supplied by mobile for access control.

8\. Handle duplicate records and concurrent updates.

9\. Use database indexes where beneficial.

10\. Preserve data consistency.

11\. Avoid unnecessary database queries.

12\. Use transactions where required for multi-document consistency and supported by the deployment.

13\. Never delete or migrate production data without explicit authorization and an appropriate migration plan.



\## 8. Authentication \& Authorization



1\. Backend authentication is authoritative.

2\. Protect all private endpoints with appropriate middleware.

3\. Verify token expiration and validity.

4\. Enforce resource-level authorization.

5\. Mobile must securely store authentication credentials.

6\. Use the existing authentication flow consistently.

7\. Handle expired sessions and refresh tokens according to backend implementation.

8\. Clear sensitive local data during logout.

9\. Never expose private backend credentials in mobile code.

10\. Never rely on frontend-only permission checks.



\## 9. Error Handling Across Both Applications



1\. Use consistent backend error responses.

2\. Convert backend errors into understandable mobile messages.

3\. Handle validation errors correctly.

4\. Handle authentication failures correctly.

5\. Handle network failures and request timeouts.

6\. Handle offline conditions gracefully.

7\. Handle unexpected response formats.

8\. Prevent duplicate submissions.

9\. Implement retry behavior where appropriate.

10\. Never expose server stack traces to users.

11\. Never silently swallow errors.

12\. Preserve recoverable user input when requests fail.



\## 10. Mobile Architecture Rules



Follow `mobile/AGENTS.md`.



\- React Native and Expo.

\- NativeWind styling.

\- Existing navigation architecture.

\- Existing Context API state management.

\- Reusable components and hooks.

\- Centralized API services.

\- Secure token storage.

\- Multilingual support.

\- Proper audio and voice permissions.

\- Production-grade error handling.



Do not introduce new libraries or architectural patterns without inspecting the existing project first.



\## 11. Backend Architecture Rules



Follow `backend/AGENTS.md`.



\- Node.js and Express.js.

\- MongoDB and Mongoose.

\- Modular routes, controllers, services, and models.

\- Request validation.

\- Authentication and authorization.

\- Centralized error handling.

\- Secure API design.

\- Swagger documentation.

\- Production-grade database operations.



Keep backend business logic independent of mobile UI implementation.



\## 12. Shared Feature Development



For every new feature, determine which application owns each responsibility.



| Responsibility                    | Application |

| --------------------------------- | ----------- |

| Screens and user interactions     | Mobile      |

| Styling and animations            | Mobile      |

| Microphone and device permissions | Mobile      |

| API requests                      | Mobile      |

| Business rules                    | Backend     |

| Database models and queries       | Backend     |

| Authentication verification       | Backend     |

| Authorization                     | Backend     |

| Data validation                   | Backend     |

| AI provider secret credentials    | Backend     |

| Persistent application data       | Backend     |

| API contract                      | Shared      |

| Error handling                    | Shared      |

| Integration testing               | Shared      |



A feature may require both applications to change.



Do not force changes into an application when they are not technically required.



\## 13. Voice, AI \& Multilingual Integration



1\. Keep privileged AI operations and provider credentials on the backend.

2\. Mobile handles user interaction and device-level audio operations.

3\. Backend handles protected AI integrations and business operations.

4\. Validate AI-generated actions before executing them.

5\. Never allow AI output to bypass normal authorization and validation.

6\. Handle audio upload and processing failures.

7\. Handle microphone permission denial.

8\. Maintain consistent language identifiers and locale handling.

9\. Support Unicode and Indian language scripts.

10\. Keep translation and language-selection behavior consistent across applications.

11\. Protect inventory, billing, and sales operations against unauthorized AI actions.



\## 14. Environment \& Network Configuration



1\. Keep mobile and backend environment configurations separate.

2\. Use centralized API base URL configuration.

3\. Do not hardcode API URLs across components.

4\. Never assume `localhost` works from a physical mobile device.

5\. Use the correct development machine IP or configured development URL for physical devices.

6\. Use HTTPS for production API communication.

7\. Never expose backend environment secrets to the mobile bundle.

8\. Keep local `.env` files out of Git.

9\. Maintain appropriate `.env.example` files.

10\. Verify development and production configurations independently.



\## 15. Project-Wide Change Management



You are allowed to modify files in both applications when necessary.



Before making changes:



1\. Inspect the relevant files in both applications.

2\. Understand existing dependencies.

3\. Identify all affected files.

4\. Determine the safest implementation sequence.

5\. Preserve existing working features.



During changes:



1\. Implement backend changes first when backend functionality is missing or the contract must change.

2\. Implement dependent mobile changes afterward.

3\. Keep code modular.

4\. Update related tests and documentation.

5\. Avoid unrelated modifications.

6\. Do not duplicate existing functionality.



After changes:



1\. Inspect all modified files.

2\. Check imports and dependencies.

3\. Check API contracts.

4\. Check authentication and authorization.

5\. Verify database behavior.

6\. Verify mobile integration.

7\. Run available tests and checks.

8\. Report any remaining limitations.



\## 16. Research \& Documentation



1\. Research official documentation when uncertain.

2\. Prefer official Expo, React Native, NativeWind, Express, MongoDB, and Mongoose documentation.

3\. Verify package compatibility with existing versions.

4\. Never invent APIs or package capabilities.

5\. Inspect existing code before installing new dependencies.

6\. Update relevant documentation after API or architecture changes.

7\. Keep API documentation synchronized with actual backend implementation.



\## 17. Mandatory Completion Report



After implementation, always report:



1\. \*\*Feature:\*\* What was implemented.

2\. \*\*Backend Changes:\*\* Files and functionality changed.

3\. \*\*Mobile Changes:\*\* Files and functionality changed.

4\. \*\*API Integration:\*\* Endpoints and contracts used or updated.

5\. \*\*Database Changes:\*\* Models, schemas, indexes, or migrations.

6\. \*\*Dependencies:\*\* New packages and configuration changes.

7\. \*\*Security \& Error Handling:\*\* Important protections and edge cases.

8\. \*\*Verification:\*\* Actual commands executed and results.

9\. \*\*Remaining Work:\*\* Incomplete functionality or manual steps.



Clearly state if only one application needed changes and explain why.



\## 18. Non-Negotiable Development Rules



\- You have access to both mobile and backend code.

\- Inspect both applications when a feature crosses their boundary.

\- When backend support is missing, build it first.

\- When backend contracts change, update dependent mobile code.

\- Never use fake frontend data to pretend backend integration exists.

\- Never leave required API integration incomplete.

\- Never duplicate existing functionality.

\- Never break existing functionality unnecessarily.

\- Never make unrelated changes.

\- Never expose secrets.

\- Never claim unverified results.

\- Follow root and application-specific AGENTS.md instructions.



\# FINAL RULE



\*\*Treat DukaanVoice as one complete full-stack product.\*\*



When a user requests a feature from the mobile side, inspect the backend and add any missing backend functionality first. Then connect and update the mobile application.



When a user requests a backend change, inspect and update the mobile application wherever that change affects its APIs, data structures, or behavior.



\*\*Always maintain both applications together, with the backend as the source of truth and the mobile application correctly synchronized with it.\*\*



