import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getCustomerGuarantees } from "@/actions/guarantee.actions"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldCheckIcon } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("guarantee")
  return { title: t("title") }
}

export default async function CustomerGuaranteePage() {
  const t = await getTranslations("guarantee")
  const guarantees = await getCustomerGuarantees()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {guarantees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <ShieldCheckIcon className="size-12 text-muted-foreground" />
            <CardTitle>{t("noCards")}</CardTitle>
            <CardDescription>{t("noCardsDescription")}</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guarantees.map((card) => {
            const isActive = new Date(card.expiresAt) > new Date()
            const product = card.orderItem?.variant?.product
            const image = product?.images?.[0]

            return (
              <Card key={card.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {image && (
                        <Image
                          src={image.url}
                          alt={product?.name ?? ""}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          {product?.name ?? "Product"}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {card.serialNumber}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={isActive ? "default" : "destructive"}>
                      {isActive ? t("active") : t("expired")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("warranty")}
                    </span>
                    <span>
                      {card.warrantyMonths} {t("months")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("expiresAt")}
                    </span>
                    <span>
                      {new Date(card.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("order")}
                    </span>
                    <span className="font-mono text-xs">
                      {card.orderItem?.order?.orderNumber}
                    </span>
                  </div>
                  {isActive && (
                    <Button asChild variant="outline" className="mt-2 w-full" size="sm">
                      <Link
                        href={`/dashboard/repairs/new?guarantee=${card.id}`}
                      >
                        {t("requestRepair")}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
