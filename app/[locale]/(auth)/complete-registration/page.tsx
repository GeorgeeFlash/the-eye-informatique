import { redirect } from "next/navigation"

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ affiliate?: string }>
}) {
  const { affiliate } = await searchParams

  if (affiliate === "true") {
    redirect("/dashboard/affiliate-apply")
  }

  redirect("/")
}
