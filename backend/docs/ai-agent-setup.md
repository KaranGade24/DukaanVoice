# AI assistant setup

The assistant uses LangGraph with the Google Gemini LangChain integration. Configure one or more server-only keys in the backend environment:

```env
GOOGLE_API_KEY_1=...
GOOGLE_API_KEY_2=...
GEMINI_MODEL=gemini-3.8-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_OUTPUT_TOKENS=512
GEMINI_TIMEOUT_MS=30000
GEMINI_MAX_RETRIES=2
GEMINI_COOLDOWN_MS=60000
GEMINI_MAX_COOLDOWN_MS=900000
AI_MAX_TOOL_ROUNDS=4
AI_RECURSION_LIMIT=18
AI_HISTORY_LIMIT=8
```

`GOOGLE_API_KEY` is also accepted as a fallback. Empty and duplicate keys are ignored. Key selection stays on a healthy key and cools a quota-limited key before trying another. Transient network/server failures use bounded retries. Key values and key status are never returned to clients. If no keys are configured, only AI assistant calls return `503`; the rest of the API continues to start normally.

Cooldown state is held in process memory and is local to each backend instance. If the service runs multiple instances and needs coordinated key cooldowns, replace the state map in `modules/ai-agent/config/geminiKeyManager.js` with an atomic Redis-backed store; Redis is intentionally not required for a single instance.

Conversations, draft bills, and customer records are scoped to the authenticated user and their resolved shop. The agent can prepare but cannot post a sale. Posting requires a short-lived, server-issued confirmation token bound to the exact bill snapshot and an explicit authenticated confirmation request. Sale totals, prices, stock checks, stock movements, and transaction handling are delegated to the existing sales service. A changed catalog price invalidates confirmation until the bill is refreshed and shown again.

Streaming currently sends the completed assistant response as one SSE event; it does not stream model tokens. The POS may send its current item IDs, quantities, payment selection, discount, and optional customer ID as a draft; the backend re-reads product prices, stock, and customer ownership before using that snapshot.

The agent's single validated registry creates its product, inventory, customer, billing, and reporting tools from authenticated user/shop/conversation context. A complete-sale tool can request confirmation in the user interface, but it cannot post a sale. Only POST /api/ai-agent/confirm-action can consume the server-issued bill token and delegate to the transaction-backed sales service. Replaying that token returns the already-created sale by idempotency key.
