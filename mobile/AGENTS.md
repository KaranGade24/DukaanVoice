# AGENTS.md — DukaanVoice Mobile App Coding Instructions

## 1. Project Structure & Architecture

1. Always follow the existing project folder structure.
2. Never change, rename, move, or delete existing files or folders without a valid reason.
3. Keep code modular, reusable, and maintainable.
4. Separate screens, components, hooks, services, contexts, stores, utilities, constants, and configuration.
5. Never put the entire application logic inside a single screen or component.
6. Keep UI, business logic, API communication, and state management separate.
7. Create reusable components instead of duplicating UI code.
8. Use a consistent architecture throughout the application.
9. Before creating a new file, inspect the existing structure and check whether a suitable file already exists.
10. Avoid unnecessary folders, files, dependencies, and abstractions.

## 2. Production-Grade Code Quality

11. Always write production-ready, clean, readable, and maintainable code.
12. Prioritize reliability, performance, scalability, and user experience.
13. Avoid shortcuts, temporary solutions, unnecessary workarounds, and incomplete implementations.
14. Never use placeholder logic in a feature presented as complete.
15. Never leave unnecessary TODO comments, dead code, unused imports, or debugging statements.
16. Handle all possible success, failure, loading, empty, and edge-case states.
17. Use asynchronous operations correctly with async/await.
18. Avoid deeply nested conditions and unnecessarily complicated functions.
19. Use meaningful variable, function, component, and file names.
20. Prefer simple, reusable, and efficient implementations.

## 3. React Native & Expo Standards

21. Use React Native components and APIs correctly.
22. Follow the existing Expo project configuration and architecture.
23. Use Expo-compatible libraries and APIs.
24. Before installing a dependency, check whether it is already installed and whether Expo supports the required version.
25. Prefer Expo-compatible packages and use `npx expo install` when appropriate.
26. Never use browser-only APIs such as `window`, `document`, or DOM manipulation in native application code.
27. Never assume a web-only library works in React Native.
28. Use `SafeAreaView` or the appropriate safe-area APIs to support different devices. "react-native-safe-area-context" use this in \_layout main root file
29. Handle Android and iOS platform differences wherever necessary.
30. Ensure the application works across different screen sizes, resolutions, and device orientations where supported.
31. Use `Platform` or platform-specific files when platform behavior genuinely differs.
32. Follow React hooks rules and avoid unnecessary re-renders.
33. Clean up event listeners, subscriptions, timers, and other resources when components unmount.
34. Never suppress React warnings without understanding and fixing their cause.

## 4. JavaScript Standards

35. Follow the javascript configured in the project.
36. Never use TypeScript type assertions merely to hide errors.
37. Use consistent naming conventions.
38. Use camelCase for variables and functions and PascalCase for components and types.
39. Keep functions focused on one responsibility.
40. Avoid unnecessary type duplication.
41. Never introduce TypeScript into JavaScript files.

## 5. NativeWind & Styling

45. Use NativeWind as the primary styling solution if it is already configured.
46. Follow the existing design system, theme, and styling conventions.
47. Do not introduce a second styling framework without a valid reason.
48. Use reusable styles and shared components for common UI patterns.
49. Keep colors, typography, spacing, border radii, and shadows consistent.
50. Use centralized theme tokens instead of repeating arbitrary values.
51. Avoid excessive inline styles.
52. Do not mix web CSS properties with React Native styling properties.
53. Use supported NativeWind utilities and verify compatibility before using unfamiliar classes.
54. Ensure all components have consistent spacing and alignment.
55. Never compromise readability or accessibility for visual appearance.

## 6. Component Development

57. Build reusable and independently maintainable components.
58. Keep components small and focused.
59. Separate complex logic into custom hooks or service functions.
60. Use props with clear and appropriate types.
61. Avoid unnecessary prop drilling; use the existing state-management approach where appropriate.
62. Avoid unnecessary component nesting.
63. Use stable keys when rendering lists.
64. Use `FlatList` or `SectionList` for large or dynamic lists instead of rendering large collections with `ScrollView` and `.map()`.
65. Optimize list rendering and avoid unnecessary item re-renders.
66. Do not create duplicate components for UI elements that already exist.

## 7. Navigation & Screen Management

67. Follow the navigation solution already configured in the project.
68. If Expo Router is configured, use its file-based routing conventions.
69. Keep navigation definitions and screen responsibilities organized.
70. Do not implement multiple navigation systems unnecessarily.
71. Handle authentication-based navigation correctly.
72. Prevent unauthorized access to protected screens.
73. Handle loading states during authentication and navigation.
74. Preserve navigation state where appropriate.
75. Handle back navigation correctly on Android and iOS.
76. Avoid unnecessary navigation resets or duplicate screen transitions.

## 8. API Integration & Backend Communication

77. Keep all API communication inside organized service modules.
78. Never write API request logic directly throughout multiple UI components.
79. Use a centralized API client where appropriate.
80. Keep API base URLs and configuration in environment-specific configuration.
81. Never hardcode production URLs throughout the application.
82. Never expose secret API keys, private tokens, or server credentials in mobile application code.
83. Handle network failures, timeouts, unauthorized responses, and server errors.
84. Validate API response data before relying on assumptions about its structure.
85. Handle loading, success, empty, and error states properly.
86. Avoid duplicate API requests and unnecessary network calls.
87. Implement pagination or incremental loading for large datasets where appropriate.
88. Keep request and response handling consistent across services.
89. Use secure storage for sensitive authentication information.
90. Never assume that hiding a UI element provides backend authorization.

## 9. State Management

91. Follow the state-management solution already used in the project context useContext.
92. Do not introduce another state-management library without a valid requirement.
93. Keep global state limited to genuinely shared application data.
94. Use local component state for local UI behavior.
95. Avoid unnecessary global state.
96. Keep state updates predictable and immutable.
97. Handle loading, error, and success states consistently.
98. Avoid storing duplicate or derived data unnecessarily.
99. Prevent stale state and race conditions in asynchronous operations.
100.  Clean up subscriptions and asynchronous effects appropriately.

## 10. Error Handling & Reliability

101. Every asynchronous operation must have appropriate error handling.
102. Never leave rejected promises unhandled.
103. Show understandable error messages to users.
104. Never expose internal stack traces, private data, or sensitive server errors in the UI.
105. Use centralized error-handling utilities where appropriate.
106. Handle offline and unstable network conditions gracefully.
107. Prevent repeated submissions when an operation is already processing.
108. Handle unexpected null, undefined, and missing values.
109. Ensure errors do not crash the entire application unnecessarily.
110. Never silently ignore errors.

## 11. Performance Optimization

111. Optimize rendering and avoid unnecessary component updates.
112. Use `useMemo`, `useCallback`, and `React.memo` only when they provide a real benefit.
113. Avoid expensive calculations during every render.
114. Optimize images, image sizes, and asset loading.
115. Use lazy loading or dynamic imports where supported and beneficial.
116. Avoid unnecessary dependencies and large packages.
117. Keep startup time and screen transitions efficient.
118. Avoid memory leaks from timers, subscriptions, and event listeners.
119. Optimize animations to run smoothly on supported devices.
120. Never sacrifice code readability for insignificant performance improvements.

## 12. UI/UX & Accessibility

121. Follow the established DukaanVoice design system consistently.
122. Every screen must have a polished, responsive, and professional interface.
123. Support different Android and iOS screen sizes.
124. Handle safe areas, status bars, navigation bars, and keyboard behavior correctly.
125. Prevent content from being hidden behind the keyboard.
126. Provide visible feedback for button presses and user actions.
127. Include loading indicators for operations that take time.
128. Provide empty states when no data is available.
129. Provide useful error and retry states.
130. Ensure text is readable and buttons have appropriate touch areas.
131. Use accessibility labels and roles where appropriate.
132. Never use color alone to communicate important information.
133. Maintain consistent typography, spacing, and visual hierarchy.
134. Ensure animations do not block essential interactions.

## 13. Multilingual & Localization

135. Follow the existing internationalization architecture.
136. Never hardcode user-facing text when a localization system is configured.
137. Keep translations in their appropriate language resource files.
138. Support the languages required by the application.
139. Do not assume every language uses the same text length or word order.
140. Design layouts to accommodate longer translated text.
141. Handle Unicode characters correctly.
142. Support Indian language scripts and fonts where required.
143. Avoid manually translating text inside components.
144. Keep language selection and persistence consistent throughout the application.

## 14. Voice & Audio Features

145. Follow Expo-compatible audio and voice APIs.
146. Request microphone permissions before accessing microphone functionality.
147. Handle permission denial and unavailable microphone hardware gracefully.
148. Handle recording, playback, and audio session states correctly.
149. Clean up audio resources when they are no longer required.
150. Handle network interruptions during voice operations.
151. Do not assume microphone access is always available.
152. Provide clear recording, processing, success, and failure feedback.
153. Never expose voice-service credentials or secret API keys in the mobile application.
154. Keep voice processing and backend communication separate from UI components.
155. Verify platform-specific audio restrictions before implementing audio features.

## 15. Authentication & Mobile Security

156. Never hardcode credentials, passwords, API secrets, or private keys.
157. Store sensitive authentication information using an appropriate secure-storage solution.
158. Never store sensitive tokens in ordinary unencrypted local storage.
159. Handle token expiration and refresh flows correctly when supported by the backend.
160. Clear sensitive session data during logout.
161. Do not log passwords, tokens, OTPs, or private user information.
162. Validate user input before sending it to the backend.
163. Treat all client-side data as untrusted.
164. Do not store sensitive personal information unnecessarily.
165. Follow secure communication practices using HTTPS in production.

## 16. Forms & User Input

166. Validate user input before submitting requests.
167. Provide clear validation messages.
168. Prevent duplicate submissions.
169. Handle keyboard types and input modes correctly.
170. Use appropriate input controls for numbers, currency, dates, and text.
171. Preserve user-entered data when a recoverable request fails.
172. Handle empty values and invalid input safely.
173. Avoid unnecessary re-renders while typing.
174. Keep form validation logic separate and reusable where appropriate.

## 17. Environment & Configuration

175. Keep development, testing, and production configurations separate.
176. Never hardcode environment-specific configuration in individual components.
177. Follow Expo's environment-variable conventions.
178. Remember that client-side environment variables are not secret.
179. Keep local secrets out of Git.
180. Update `.env.example` when introducing new environment variables.
181. Do not modify Expo configuration unnecessarily.
182. Verify package compatibility before changing dependency versions.

## 18. Research & Documentation

183. When uncertain about an API, package, or implementation, research its official documentation before coding.
184. Prefer official React Native, Expo, NativeWind, and library documentation.
185. Verify that APIs and packages are compatible with the installed project versions.
186. Do not invent APIs, methods, configuration options, or package behavior.
187. Check existing implementations before introducing new patterns.
188. Avoid outdated or deprecated APIs when a supported alternative exists.
189. Explain important configuration changes and any required manual setup.
190. Update relevant documentation when implementation changes affect project setup or usage.

## 19. Existing Code Modification Rules

191. Inspect the relevant files before making changes.
192. Understand the existing implementation and dependencies first.
193. Modify only the files necessary to complete the requested task.
194. Preserve existing working functionality.
195. Never rewrite an entire file when a small, safe change is sufficient.
196. Never remove existing features without explicit authorization.
197. Avoid unrelated refactoring.
198. Check all imports, exports, navigation references, and dependencies after modifications.
199. Do not claim a feature is complete if it is only partially implemented.
200. Explain breaking changes before making them.

## 20. Final Verification

201. After implementation, inspect all modified files.
202. Run the relevant lint, type-check, and build commands available in the project.
203. Resolve errors introduced by your changes.
204. Check for missing dependencies and invalid imports.
205. Verify Expo compatibility.
206. Check that the modified screens and components follow the existing architecture.
207. Never claim tests or builds passed unless they were actually executed successfully.
208. If a command cannot be executed, clearly report why.
209. Mention any remaining limitations or manual setup steps.
210. Do not modify unrelated files just to make verification pass.

## 21. Mandatory Response After Every Implementation

After completing any coding task, always report:

1. **Implementation:** What was implemented or changed.
2. **Files Modified:** List the created and modified files.
3. **Dependencies:** Any new packages installed or configuration changes.
4. **Error Handling:** Important failure and edge cases handled.
5. **Verification:** Commands executed and their actual results.
6. **Remaining Work:** Any incomplete implementation or manual steps required.

## NON-NEGOTIABLE RULE

Always prioritize production-grade quality, modular architecture, maintainability, security, performance, and reliability.

Follow the existing project structure. Do not make unnecessary changes. Never invent APIs or claim unverified results. If requirements are unclear, inspect the codebase and ask for clarification when necessary.

**Write code as if it will be maintained and used in a real production mobile application, not as a temporary demo or tutorial project.**
