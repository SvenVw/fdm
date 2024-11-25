import { createCookieSessionStorage } from "@remix-run/node";

const fdmSessionSecret = process.env.FDM_SESSION_SECRET;
if (!fdmSessionSecret) {
  throw new Error("FDM_SESSION_SECRET must be set");
}
type SessionData = {
  session_id: string
};

type SessionFlashData = {
  error: string;
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>(
    {
      cookie: {
        name: "__session",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: [fdmSessionSecret],
        secure: process.env.NODE_ENV === "production", // enable this in prod only
      },
    }
  );

export { getSession, commitSession, destroySession };
