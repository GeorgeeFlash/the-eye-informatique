import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

// Moved to (admin)/activity-log so both ADMIN and CENTRAL_ADMIN can access.
// This redirect ensures old bookmarks still work.
export default async function ActivityLogRedirect() {
  const locale = await getLocale();
  redirect({ href: "/admin/activity-log", locale });
}
