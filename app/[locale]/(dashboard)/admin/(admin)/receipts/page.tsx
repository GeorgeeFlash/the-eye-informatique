import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { ReceiptScanner } from "./receipt-scanner"

export default async function ReceiptScanPage() {
  await requireRole(["ADMIN", "CENTRAL_ADMIN", "STAFF"])
  const t = await getTranslations("ai")

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("receiptScan")}</h1>
        <p className="text-muted-foreground">{t("receiptScanDescription")}</p>
      </div>

      <ReceiptScanner />
    </div>
  )
}
