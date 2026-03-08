import { getTranslations } from "next-intl/server"
import { getMyAffiliateProfile } from "@/actions/affiliate.actions"
import { formatDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { APP_URL } from "@/lib/constants"
import { CreateLinkForm } from "./create-link-form"
import { DeleteLinkButton } from "./delete-link-button"

export default async function AffiliateLinksPage() {
  const t = await getTranslations("affiliate")
  const profile = await getMyAffiliateProfile()
  if (!profile) return null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("links")}</h1>

      <CreateLinkForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("myLinks")}</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.links.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLinks")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("targetUrl")}</TableHead>
                  <TableHead>{t("clicks")}</TableHead>
                  <TableHead>{t("created")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">
                        {APP_URL}/ref/{link.code}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-50 truncate text-sm">
                      {link.targetUrl}
                    </TableCell>
                    <TableCell>{link.clickCount}</TableCell>
                    <TableCell>{formatDate(link.createdAt)}</TableCell>
                    <TableCell>
                      <DeleteLinkButton linkId={link.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
