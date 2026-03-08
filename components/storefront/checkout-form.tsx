"use client"

import { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { checkoutSchema } from "@/lib/validators/order.schema"
import { createOrder } from "@/actions/order.actions"
import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2Icon, StoreIcon, TruckIcon } from "lucide-react"

type Address = {
  id: string
  label: string | null
  street: string
  city: string
  region: string
}

interface CheckoutFormProps {
  addresses: Address[]
  branches: { id: string; name: string; city: string }[]
}

type CheckoutFormValues = {
  deliveryMethod: "PICKUP" | "DELIVERY"
  paymentMethod: "MOBILE_MONEY" | "CHECKOUT"
  installments: boolean
  addressId?: string
  branchId?: string
  notes?: string
  phone?: string
  gateway?: "CM_MTNMOMO" | "CM_ORANGE"
}

export function CheckoutForm({ addresses, branches }: CheckoutFormProps) {
  const t = useTranslations("checkout")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    region: "",
    label: "",
  })
  const { items, clearCart, totalPrice, totalItems } = useCart()

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as never,
    defaultValues: {
      deliveryMethod: "PICKUP",
      paymentMethod: "MOBILE_MONEY",
      installments: false,
      gateway: "CM_MTNMOMO",
    },
  })

  const deliveryMethod = form.watch("deliveryMethod")
  const paymentMethod = form.watch("paymentMethod")
  const installments = form.watch("installments")

  function onSubmit(data: CheckoutFormValues) {
    setServerError(null)

    if (items.length === 0) {
      toast.error(t("emptyCart"))
      return
    }

    startTransition(async () => {
      const orderData = {
        ...data,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        ...(showNewAddress &&
          data.deliveryMethod === "DELIVERY" && {
            newAddress: {
              street: newAddress.street,
              city: newAddress.city,
              region: newAddress.region,
              label: newAddress.label || undefined,
            },
          }),
      }

      const result = await createOrder(orderData)

      if ("error" in result) {
        const errorMessages = Object.values(result.error ?? {}).flat()
        setServerError(errorMessages.join(", "))
        return
      }

      clearCart()
      toast.success(t("orderSuccess"))
      router.push(`/${locale}/dashboard/orders/${result.orderId}`)
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Checkout form */}
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Delivery method */}
            <Card>
              <CardHeader>
                <CardTitle>{t("deliveryMethod")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="deliveryMethod"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={
                            field.value === "PICKUP" ? "default" : "outline"
                          }
                          className="h-auto flex-col gap-2 p-4"
                          onClick={() => field.onChange("PICKUP")}
                        >
                          <StoreIcon className="size-6" />
                          <span>{t("pickup")}</span>
                        </Button>
                        <Button
                          type="button"
                          variant={
                            field.value === "DELIVERY" ? "default" : "outline"
                          }
                          className="h-auto flex-col gap-2 p-4"
                          onClick={() => field.onChange("DELIVERY")}
                        >
                          <TruckIcon className="size-6" />
                          <span>{t("delivery")}</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Branch selection for pickup */}
                {deliveryMethod === "PICKUP" && branches.length > 0 && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>{t("pickupBranch")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("selectBranch")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name} — {b.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Address for delivery */}
                {deliveryMethod === "DELIVERY" && (
                  <div className="mt-4 space-y-4">
                    {addresses.length > 0 && !showNewAddress && (
                      <FormField
                        control={form.control}
                        name="addressId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("deliveryAddress")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("selectAddress")}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {addresses.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.label
                                      ? `${a.label} — ${a.street}, ${a.city}`
                                      : `${a.street}, ${a.city}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="button"
                      variant="link"
                      className="p-0"
                      onClick={() => setShowNewAddress(!showNewAddress)}
                    >
                      {showNewAddress
                        ? t("useExistingAddress")
                        : t("addNewAddress")}
                    </Button>

                    {showNewAddress && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-sm font-medium">
                            {t("street")}
                          </label>
                          <Input
                            value={newAddress.street}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                street: e.target.value,
                              }))
                            }
                            placeholder={t("streetPlaceholder")}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            {t("city")}
                          </label>
                          <Input
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                city: e.target.value,
                              }))
                            }
                            placeholder={t("cityPlaceholder")}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            {t("region")}
                          </label>
                          <Input
                            value={newAddress.region}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                region: e.target.value,
                              }))
                            }
                            placeholder={t("regionPlaceholder")}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-sm font-medium">
                            {t("addressLabel")}
                          </label>
                          <Input
                            value={newAddress.label}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                label: e.target.value,
                              }))
                            }
                            placeholder={t("addressLabelPlaceholder")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment method */}
            <Card>
              <CardHeader>
                <CardTitle>{t("paymentMethod")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MOBILE_MONEY">
                            {t("mobileMoney")}
                          </SelectItem>
                          <SelectItem value="CHECKOUT">
                            {t("cardPayment")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mobile Money gateway */}
                {paymentMethod === "MOBILE_MONEY" && (
                  <>
                    <FormField
                      control={form.control}
                      name="gateway"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("gateway")}</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant={
                                field.value === "CM_MTNMOMO"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => field.onChange("CM_MTNMOMO")}
                            >
                              MTN MoMo
                            </Button>
                            <Button
                              type="button"
                              variant={
                                field.value === "CM_ORANGE"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => field.onChange("CM_ORANGE")}
                            >
                              Orange Money
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("phoneNumber")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="6XXXXXXXX"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Installments toggle */}
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t("payInInstallments")}
                        </FormLabel>
                        <FormDescription>
                          {t("installmentsDescription")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {installments && (
                  <Alert>
                    <AlertDescription>
                      {t("installmentsBreakdown", {
                        amount: formatCurrency(Math.ceil(totalPrice / 3)),
                        months: 3,
                      })}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t("additionalNotes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("notesPlaceholder")}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isPending || items.length === 0}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("placeOrder")
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Order summary sidebar */}
      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>{t("orderSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.productName} x{item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("subtotal")} ({totalItems})
              </span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span className="text-muted-foreground">
                {deliveryMethod === "PICKUP"
                  ? t("free")
                  : t("calculatedAtOrder")}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>{t("total")}</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
