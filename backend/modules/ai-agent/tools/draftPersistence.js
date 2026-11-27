import AgentConversation from "../../../models/AgentConversation.js";
import { serviceError } from "../../inventory/inventory.shared.js";

export const findEditableConversation = (filter) =>
  AgentConversation.findOne({
    ...filter,
    confirmationClaimedAt: null,
    archivedAt: null,
  });

export const saveEditableDraft = async (conversation) => {
  const updated = await AgentConversation.findOneAndUpdate(
    {
      _id: conversation._id,
      userId: conversation.userId,
      shopId: conversation.shopId,
      updatedAt: conversation.updatedAt,
      confirmationClaimedAt: null,
      archivedAt: null,
    },
    {
      $set: {
        draft: conversation.draft,
        pendingAction: conversation.pendingAction,
      },
    },
    { returnDocument: "after", runValidators: true },
  );
  if (!updated) {
    throw serviceError(
      409,
      "BILL_CHANGED_REVIEW",
      "The bill is being confirmed or changed in another session. Reload and review it before editing.",
    );
  }
  return updated;
};
