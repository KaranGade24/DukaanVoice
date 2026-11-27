import { sendSuccess } from "../../utils/response.js";
import * as service from "./ai-agent.service.js";

export const chat = async (req, res) =>
  sendSuccess(res, 200, await service.chat(req.user._id, req.body));

export const chatStream = async (req, res) => {
  const result = await service.chat(req.user._id, req.body);
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("event: response\ndata: " + JSON.stringify(result) + "\n\n");
  res.end();
};

export const list = async (req, res) =>
  sendSuccess(res, 200, await service.listConversations(req.user._id));

export const get = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.getConversation(req.user._id, req.validatedParams.id),
  );

export const updateDraft = async (req, res) =>
  sendSuccess(res, 200, await service.updateConversationDraft(req.user._id, req.validatedParams.id, req.body.draft));

export const archive = async (req, res) =>
  sendSuccess(
    res,
    200,
    await service.archiveConversation(req.user._id, req.validatedParams.id),
  );

export const confirm = async (req, res) =>
  sendSuccess(res, 200, await service.confirmAction(req.user._id, req.body));

export const cancel = async (req, res) =>
  sendSuccess(res, 200, await service.cancelAction(req.user._id, req.body));
