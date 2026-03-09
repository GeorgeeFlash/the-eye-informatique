"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function UserNav() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const t = useTranslations("userNav")

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?"
    : "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full p-0" aria-label={t("myAccount")}>
          <Avatar className="size-9">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? t("user")} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">
              {user?.fullName ?? t("user")}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <UserIcon className="mr-2 size-4" />
            {t("profile")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            <SettingsIcon className="mr-2 size-4" />
            {t("settings")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon className="mr-2 size-4" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
