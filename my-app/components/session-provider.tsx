"use client";

import { createContext, useContext } from "react";
import type { Session } from "@/lib/access";

const SessionContext = createContext<Session | null>(null);

/** Makes the session (read from the cookie by the dashboard layout) available to client pages. */
export function SessionProvider({ session, children }: { session: Session | null; children: React.ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
