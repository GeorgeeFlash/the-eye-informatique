import createImageUrlBuilder from '@sanity/image-url'
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { dataset, projectId } from '../env'

if (!projectId || !dataset) {
  throw new Error(
    `[sanity/lib/image] Missing required Sanity configuration: ${
      !projectId ? "projectId" : "dataset"
    } is undefined. Check your environment variables (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET).`
  )
}

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}
