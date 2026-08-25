# Image Bucket (Media Library) for the Admin Panel

## Goal
Add a reusable, DB-backed **media library** ("image bucket") to the admin panel. Admins can
browse/upload/select images from a central library. The category create/edit forms use a picker
instead of the current free-text `iconUrl` input.

## Decisions locked in
- **Storage**: DB-backed. New `ImageAsset` model records every upload (Vercel Blob remains the file store via the existing `/api/upload` route).
- **Access**: `ADMIN` + `CENTRAL_ADMIN` (both sidebar variants).
- **Scope**: General-purpose reusable media library, not category-specific.
- **Category form**: Replace the `iconUrl` text input with a picker only (no manual URL field).

## Architecture

### Data model — `prisma/schema.prisma`
Add (lean, no folder column — the curated bucket holds only `media` uploads):
```prisma
model ImageAsset {
  id           String   @id @default(cuid())
  url          String
  fileName     String
  mimeType     String
  size         Int
  uploadedById String?
  createdAt    DateTime @default(now())

  uploadedBy   User?    @relation("UploadedImages", fields: [uploadedById], references: [id])

  @@index([createdAt])
}
```
Add to `User`: `uploadedAssets ImageAsset[] @relation("UploadedImages")`.

Migration: `prisma migrate dev --name add_image_asset` (creates a timestamped folder with `migration.sql`; the repo's `prisma/migrations/*` convention is timestamped subfolders — note there is an empty stray file `prisma/migrations/temp_migration.sql` at the root that should be removed before migrating so it isn't mistaken for a migration). Then `prisma generate` (runs via postinstall).

### Upload pipeline — `app/api/upload/route.ts`
- Add `"media"` to `ALLOWED_FOLDERS` (this is the blob *storage* folder, unrelated to any DB column).
- Import `db` from `@/server/db`. **Only when `folder === "media"`**, after the successful `put()`, create an `ImageAsset` row (url, fileName, mimeType, size, uploadedById). Wrap the DB insert in try/catch so a DB failure is logged but **never** breaks the upload response — `files` is still returned. **Do not record rows for `products`/`blog`** so those hot paths stay byte-for-byte unchanged.
- Return shape unchanged (`{ files: [...] }`). Verified consumers: `components/blog/cover-image-uploader.tsx`, `components/dashboard/image-uploader.tsx` (reads `json.files[].url`), `blog/[id]/article-editor.tsx` — all unaffected.

### New media API — `app/api/media/route.ts`
- `GET /api/media?search=&take=&cursor=` — returns `{ images: ImageAsset[], nextCursor }`, newest first. Auth: `await requireRole(["ADMIN", "CENTRAL_ADMIN"])`. Each image includes an `inUse: boolean` flag. **Compute it efficiently**: issue one extra query for the set of referenced URLs (`db.category.findMany({ where: { iconUrl: { not: null } }, select: { iconUrl: true } })`), build a `Set`, and set `inUse = set.has(image.url)` per row — O(1) per image, not a per-row query.
- `DELETE /api/media?id=` — auth as above. **Referential guard**: look up the `ImageAsset`, then check `db.category.count({ where: { iconUrl: asset.url } })`. If greater than 0, return `Response.json({ error: "in_use" }, { status: 409 })` and do **not** delete. Otherwise call `@vercel/blob`'s `del(url)` and remove the `ImageAsset` row; return `{ success: true }`.
- **Why URL match, not a FK**: `Category.iconUrl` is a free-text string, not a relation to `ImageAsset`, so a DB-level FK is impossible without a larger schema migration (out of scope). URL matching is the pragmatic guard.
- **Auth convention**: call `requireRole` *directly* (no try/catch), matching `app/api/ai/knowledge-base/route.ts:6`. `requireRole` throws on unauthorized, which is the existing route-handler pattern — do not wrap it to fabricate a 403. Use `Response.json(...)` for error bodies (matches the knowledge-base route), not `NextResponse`.
- **Image-only filter**: constrain results to image mimeTypes (`mimeType IN ['image/jpeg','image/png','image/webp','image/gif']`) so videos uploaded to other folders never appear as broken thumbnails.

### Reusable picker — `components/media/image-picker.tsx`
`"use client"`. Props: `{ value: string; onChange: (url: string) => void; currentPreview?: boolean }`.
- Shows current image (preview + remove button) when `value` is set.
- "Select image" button → `Dialog` with two sections:
  - **Gallery**: grid (thumbnails via `next/image`, blob URLs are whitelisted) fetched from `/api/media` with a search input. Clicking a tile sets the value and closes.
  - **Upload**: drag-and-drop + browse (reuse the interaction pattern from `components/blog/cover-image-uploader.tsx`) posting to `/api/upload` with `folder=media`; on success, auto-selects the returned URL.
- No manual URL field.

### Shared thumbnail — `components/media/media-thumbnail.tsx`
Small presentational component (`next/image` tile + overlay select/check). Used by both the picker gallery and the media page.

### Media bucket page
- `app/[locale]/(dashboard)/admin/(admin)/media/page.tsx` — server component, `requireRole(["ADMIN", "CENTRAL_ADMIN"])`, reads `searchParams` (`search`, `page`), fetches `ImageAsset` (image mimeTypes only) with limit 24 + count, renders `MediaClient`.
- `app/[locale]/(dashboard)/admin/(admin)/media/media-client.tsx` — `"use client"` grid with upload dropzone (posts to `/api/upload` folder=media), search, select-to-copy-URL, and delete (calls `DELETE /api/media` then `router.refresh()`). Each tile shows the `inUse` flag from the API as a small badge. **Delete is blocked in the UI for in-use images**: hide/disable the delete action when `inUse` is true, and surface the API's `409 in_use` error (e.g. toast) if a race occurs.

### Sidebar entry — `components/dashboard/sidebar/app-sidebar.tsx`
Add a "Media" entry to `operationsNav` (new group or under content). For both `admin` and `central-admin` variants, add:
```ts
{ title: t("media"), url: "/admin/media", icon: "images", match: "prefix" }
```
Add `"images": ImagesIcon` to `ICON_MAP` in `components/dashboard/sidebar/nav-main.tsx` (import `ImagesIcon` from `lucide-react`).

### Category form edits
- `app/[locale]/(dashboard)/admin/(admin)/categories/[id]/category-edit-client.tsx` — replace the `iconUrl` `Input` with `<ImagePicker value={...} onChange={...} />` wired to the `iconUrl` form field. Keep `categorySchema.iconUrl` as optional URL (schema unchanged).
- **Schema/empty-string guard (important)**: `categorySchema.iconUrl` is `z.string().url().optional()`. An empty string `""` fails URL validation. The picker's `onChange` must therefore call with `undefined` (not `""`) when clearing, and the FormField must bind `value={field.value ?? undefined}` so a cleared value is `undefined`. Apply the same guard in both category forms.
- `app/[locale]/(dashboard)/admin/(admin)/categories/category-list-client.tsx` — add the same `ImagePicker` to the **create** dialog and submit `iconUrl` (currently not collected at creation).
- `actions/category.actions.ts` — `createCategory` already parses `iconUrl`; add `iconUrl: parsed.data.iconUrl ?? null` to the `create` data (it is currently dropped).

### Blog cover edit
- `app/[locale]/(dashboard)/admin/(admin)/blog/[id]/article-editor.tsx:463` — replace `<CoverImageUploader value={coverImage} onChange={setCoverImage} />` with the shared `<ImagePicker value={coverImage} onChange={setCoverImage} />`. This is a clean single-value swap (both take `value: string; onChange: (url) => void`). The `coverImage` state and `coverImageUrl` save path are unchanged.
- Remove the now-unused `CoverImageUploader` import. `components/blog/cover-image-uploader.tsx` becomes unused — delete it (confirm no other importers first; `grep` shows only `article-editor.tsx`).
- The blog editor's local `uploadFileToBlob` helper (`article-editor.tsx:224`) is now redundant (the picker handles upload) — remove it.

### Translations — `messages/en.json` + `messages/fr.json`
- `sidebar.admin.media`: "Media" / "Médias".
- New `media` namespace (shared): `title` ("Media Library"/"Bibliothèque multimédia"), `subtitle`, `searchPlaceholder`, `uploadImage`, `deleteImage`, `noImages`, `selectImage`, `uploadNew`, `urlCopied`, `confirmDelete`, `cancel`, `inUse` ("In use"/"Utilisée"), `deleteInUseError` ("This image is used by a category and can't be deleted."/"Cette image est utilisée par une catégorie et ne peut pas être supprimée.").
- Add picker-relevant `categoryAdmin` keys if needed (reuse `media` namespace in picker via `useTranslations("media")`).

## Affected boundaries
- DB schema + generated client (`ImageAsset`).
- Public `/api/upload` route (now writes rows) — verify products/blog uploads still behave.
- New `/api/media` route (GET with `inUse` flag + image-only filter; DELETE with referential 409 guard).
- New admin route `/admin/media`.
- New `components/media/*` (client components).
- Sidebar + nav icon map.
- Category create/edit forms + `createCategory` action.
- Blog article editor cover image (swap `CoverImageUploader` → shared `ImagePicker`; delete now-dead `cover-image-uploader.tsx` and the redundant `uploadFileToBlob` helper).

## Failure modes / risks
- `/api` blob hostname whitelist already covers Vercel storage — thumbnails render.
- Upload route DB insert is best-effort + logged and only runs for `folder=media`; products/blog paths are untouched.
- Orphan blob objects possible if DB insert fails; acceptable for now (library is forward-looking). Note for future cleanup.
- **Referential integrity on delete**: `Category.iconUrl` is a free-text URL, so a real FK is impossible without a schema migration. Instead the `DELETE` endpoint enforces a URL-match guard and returns `409 in_use`; the UI disables delete for in-use images via the `inUse` flag. Document the URL-match limitation (two different URL strings pointing at the same image won't be detected).
- `next/image` with blob URLs: `next.config.ts` already whitelists the Vercel blob hostname.
- Media page/API filter to image mimeTypes only — product/blog videos (which share the upload route) never render as broken thumbnails.

## Validation plan
1. `prisma migrate dev` succeeds; `ImageAsset` queryable.
2. Upload via `/api/upload` (folder=media) → row appears in `ImageAsset`.
3. `/admin/media` loads grid for ADMIN and CENTRAL_ADMIN; blocked for STAFF/customers (404/redirect via `requireRole`).
4. Picker in category edit: gallery loads, search filters, upload auto-selects, selection populates `iconUrl`, save persists; remove clears it.
5. Create dialog: icon picker present, saves `iconUrl`.
6. Delete: unused image removes row + blob. Deleting an image referenced by a category's `iconUrl` is **blocked** — API returns `409 in_use` and the UI disables the delete action (in-use badge shown).
7. Blog cover: picker loads the gallery, upload auto-selects, selection saves as `coverImageUrl`; removing clears it. `cover-image-uploader.tsx` is deleted (no remaining importers).
8. Product uploads still work unchanged (gallery out of scope).
9. `npm run lint`, `npm run typecheck`, `npm run build` green.

## Out of scope (explicit)
- Product gallery: it is multi-image (alt/primary/reorder), so the single-value picker is **not** a drop-in. Defer until a multi-image picker variant is needed.
- Backfilling/rewriting existing `iconUrl` values or reconciling pre-existing uploads.
- Folder management UI beyond a simple filter.
