import { createCustomerTools } from "./customerTools.js";
import { createInventoryTools } from "./inventoryTools.js";
import { createProductTools } from "./productTools.js";
import { createReportingTools } from "./reportingTools.js";
import { createSalesTools } from "./salesTools.js";

export const registerTools = (...groups) => {
  const tools = groups.flat();
  const names = new Set();
  for (const item of tools) {
    if (!item?.name || !item?.schema || typeof item.invoke !== "function") {
      throw new Error("AI tool registration contains an invalid tool");
    }
    if (names.has(item.name))
      throw new Error("AI tool registration contains a duplicate tool name");
    names.add(item.name);
  }
  return tools;
};

// The authenticated graph context is captured by each tool factory. This is the
// only registry used by the agent, so tools cannot receive client-supplied IDs.
export const createAgentTools = (context) =>
  registerTools(
    createProductTools(context),
    createInventoryTools(context),
    createCustomerTools(context),
    createSalesTools(context),
    createReportingTools(context),
  );

export const getAgentTool = (tools, name) =>
  tools.find((item) => item.name === name) || null;
