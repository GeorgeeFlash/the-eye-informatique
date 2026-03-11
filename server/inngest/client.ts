import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "tei-store",
  eventKey: process.env.INNGEST_EVENT_KEY,
})
