/**
 * This configuration file lets you run `$ sanity [command]` in this folder
 * Go to https://www.sanity.io/docs/cli to learn more.
 **/
import { defineCliConfig } from 'sanity/cli'
import { clientEnv } from "@/lib/env-client"

const projectId = clientEnv.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = clientEnv.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({ api: { projectId, dataset } })
