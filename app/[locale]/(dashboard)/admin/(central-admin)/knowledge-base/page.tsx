import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"
import { formatDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UploadForm } from "./upload-form"
import { DeleteDocButton } from "./delete-doc-button"

export default async function KnowledgeBasePage() {
  await requireRole(["CENTRAL_ADMIN"])
  const t = await getTranslations("ai")

  const documents = await db.knowledgeBaseDocument.findMany({
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { uploadedAt: "desc" },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("knowledgeBase")}</h1>
        <p className="text-muted-foreground">{t("knowledgeBaseDescription")}</p>
      </div>

      <UploadForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("documents")}</CardTitle>
          <CardDescription>{t("documentCount", { count: documents.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fileName")}</TableHead>
                  <TableHead>{t("uploadedBy")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("uploaded")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell>{doc.uploadedBy.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === "ACTIVE"
                            ? "default"
                            : doc.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      <DeleteDocButton docId={doc.id} />
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
