import { createCookieSessionStorage } from "@remix-run/node";

const fdmSessionSecret = String(process.env.FDM_SESSION_SECRECT)
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
        name: "__session_fdm",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: [fdmSessionSecret],
        secure: process.env.NODE_ENV === "production", // enable this in prod only
      },
    }
  );

export { getSession, commitSession, destroySession };
