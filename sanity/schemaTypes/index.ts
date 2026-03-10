import { type SchemaTypeDefinition } from 'sanity'
import { blockType } from './blockType'
import { aboutPage } from './aboutPage'
import { heroBanner } from './heroBanner'
import { legalPage } from './legalPage'
import { affiliateLanding } from './affiliateLanding'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockType, aboutPage, heroBanner, legalPage, affiliateLanding],
}
