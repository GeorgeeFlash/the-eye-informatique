// PWA offline fallback page (M10.1)
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
      <p className="text-muted-foreground">
        Vérifiez votre connexion internet et réessayez.
      </p>
      <p className="text-sm text-muted-foreground">You are offline. Check your internet connection and try again.</p>
    </div>
  )
}
