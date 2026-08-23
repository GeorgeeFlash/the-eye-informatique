import { Resend } from "resend"
import { serverEnv } from "@/server/env-server"

export const resend = new Resend(serverEnv.RESEND_API_KEY)

export const FROM_EMAIL = serverEnv.RESEND_FROM_EMAIL
