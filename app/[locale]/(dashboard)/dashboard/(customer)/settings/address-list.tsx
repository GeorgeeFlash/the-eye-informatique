"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { deleteAddress, setDefaultAddress } from "@/actions/address.actions"
import { AddressFormDialog } from "./address-form-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { MoreVerticalIcon, PlusIcon, Loader2Icon } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Address {
  id: string
  label: string | null
  street: string
  city: string
  region: string
  country: string
  isDefault: boolean
  createdAt: Date
}

interface AddressListProps {
  addresses: Address[]
  locale: "en" | "fr"
}

export function AddressList({ addresses, locale }: AddressListProps) {
  const t = useTranslations("settings")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    setEditingAddress(null)
    setDialogOpen(true)
  }

  function handleEdit(addr: Address) {
    setEditingAddress(addr)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddress(id)
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : t("addressError"))
      } else {
        toast.success(t("addressDeleted"))
      }
      setDeleteId(null)
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultAddress(id)
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : t("addressError"))
      } else {
        toast.success(t("defaultSet"))
      }
    })
  }

  return (
    <>
      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between rounded-md border p-3"
            >
              <div className="space-y-1 text-sm">
                {addr.label && (
                  <p className="font-medium">{addr.label}</p>
                )}
                <p>
                  {addr.street}, {addr.city}, {addr.region}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("addedOn", {
                    date: formatDate(new Date(addr.createdAt), "dd/MM/yyyy", locale),
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {addr.isDefault && (
                  <Badge variant="secondary">{t("default")}</Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                      {isPending ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVerticalIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(addr)}>
                      {t("editAddress")}
                    </DropdownMenuItem>
                    {!addr.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(addr.id)}>
                        {t("setDefault")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(addr.id)}
                    >
                      {t("deleteAddress")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={handleAdd}
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        {t("addAddress")}
      </Button>

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingAddress={editingAddress}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancelAddress")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
            >
              {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t("deleteAddress")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
