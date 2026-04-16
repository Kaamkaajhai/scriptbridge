import { sendTrackSession } from "./analyticsClient";
import { ensureAnonymousId, ensureSessionId, getLinkedUserKey, hasConsent, setLinkedUserKey } from "./storage";

export const linkAnonymousSessionToUser = async (user) => {
  if (!hasConsent()) return;
  if (!user?._id) return;

  const linkedKey = `${user._id}:${ensureSessionId()}`;
  if (getLinkedUserKey() === linkedKey) return;

  await sendTrackSession({
    anonymousId: ensureAnonymousId(),
    sessionId: ensureSessionId(),
    action: "link_user",
    path: `${window.location.pathname}${window.location.search}`,
    userContext: {
      userId: user._id,
      email: user.email || "",
      phone: user.phone || "",
    },
    metadata: {
      source: "post-login",
      linkedAt: new Date().toISOString(),
    },
  });

  setLinkedUserKey(linkedKey);
};
