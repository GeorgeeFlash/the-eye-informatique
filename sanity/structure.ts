import type {StructureResolver} from 'sanity/structure'

// Singleton document IDs — must match the _id used in seed data
const SINGLETONS = new Set(["aboutPage", "heroBanner", "affiliateLanding"])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singletons — show as single-item editors
      S.listItem()
        .title('Hero Banner')
        .id('heroBanner')
        .child(S.document().schemaType('heroBanner').documentId('heroBanner')),
      S.listItem()
        .title('About Page')
        .id('aboutPage')
        .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
      S.listItem()
        .title('Affiliate Landing')
        .id('affiliateLanding')
        .child(S.document().schemaType('affiliateLanding').documentId('affiliateLanding')),
      S.divider(),
      // Regular document lists (excluding singletons)
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETONS.has(item.getId() ?? "")
      ),
    ])
