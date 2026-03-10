// PWA offline fallback page (M10.1)
// These strings are intentionally hardcoded and NOT loaded via the app's i18n
// infrastructure (next-intl). When a user is offline, the service worker serves
// this page from the precache. At that point there is no network access to
// fetch translation files, so we embed both French and English directly.
// If you change these strings, also update the precached HTML by rebuilding.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
      <p className="text-muted-foreground">
        Vérifiez votre connexion internet et réessayez.
      </p>
      <p className="text-sm text-muted-foreground">
        You are offline. Check your internet connection and try again.
      </p>
    </div>
  );
}
