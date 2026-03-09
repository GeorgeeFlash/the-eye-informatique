"use server"

import { db } from "@/server/db"
import { requireAuth } from "@/lib/auth"
import { addressSchema, type AddressFormValues } from "@/lib/validators/order.schema"
import { revalidatePath } from "next/cache"

function revalidateSettings() {
  revalidatePath("/[locale]/(dashboard)", "layout")
}

// ---------------------------------------------------------------------------
// addAddress — customer adds a new address
// ---------------------------------------------------------------------------

export async function addAddress(data: AddressFormValues) {
  const user = await requireAuth()

  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // If user has no addresses yet, make this one default
  const existingCount = await db.address.count({
    where: { userId: user.id },
  })

  await db.address.create({
    data: {
      userId: user.id,
      label: parsed.data.label || null,
      street: parsed.data.street,
      city: parsed.data.city,
      region: parsed.data.region,
      country: parsed.data.country,
      isDefault: existingCount === 0,
    },
  })

  revalidateSettings()
  return { success: true }
}

// ---------------------------------------------------------------------------
// updateAddress — customer edits an existing address
// ---------------------------------------------------------------------------

export async function updateAddress(addressId: string, data: AddressFormValues) {
  const user = await requireAuth()

  const existing = await db.address.findUnique({ where: { id: addressId } })
  if (!existing || existing.userId !== user.id) {
    return { error: "Address not found" }
  }

  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.address.update({
    where: { id: addressId },
    data: {
      label: parsed.data.label || null,
      street: parsed.data.street,
      city: parsed.data.city,
      region: parsed.data.region,
      country: parsed.data.country,
    },
  })

  revalidateSettings()
  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteAddress — customer removes an address
// ---------------------------------------------------------------------------

export async function deleteAddress(addressId: string) {
  const user = await requireAuth()

  const existing = await db.address.findUnique({ where: { id: addressId } })
  if (!existing || existing.userId !== user.id) {
    return { error: "Address not found" }
  }

  // Check if address is used in any orders
  const usedInOrders = await db.order.count({
    where: { addressId },
  })
  if (usedInOrders > 0) {
    return { error: "Cannot delete an address used in orders" }
  }

  await db.address.delete({ where: { id: addressId } })

  // If deleted address was default, promote the next one
  if (existing.isDefault) {
    const nextAddress = await db.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
    if (nextAddress) {
      await db.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      })
    }
  }

  revalidateSettings()
  return { success: true }
}

// ---------------------------------------------------------------------------
// setDefaultAddress — customer sets a specific address as default
// ---------------------------------------------------------------------------

export async function setDefaultAddress(addressId: string) {
  const user = await requireAuth()

  const target = await db.address.findUnique({ where: { id: addressId } })
  if (!target || target.userId !== user.id) {
    return { error: "Address not found" }
  }

  await db.$transaction([
    // Unset current default
    db.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    }),
    // Set new default
    db.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ])

  revalidateSettings()
  return { success: true }
}
