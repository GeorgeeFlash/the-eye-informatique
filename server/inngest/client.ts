import { Inngest } from "inngest"
import { serverEnv } from "@/server/env-server"

export const inngest = new Inngest({
  id: "tei-store",
  eventKey: serverEnv.INNGEST_EVENT_KEY,
})
