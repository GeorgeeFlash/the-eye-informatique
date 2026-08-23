import { inngest } from "../client";
import { db } from "@/server/db";
import { createDisbursement, confirmDisbursement } from "@/server/payunit";
import { createNotification } from "@/actions/notification.actions";
import { APP_URL } from "@/lib/constants";

/**
 * Immediate affiliate payout — triggered when an affiliate with IMMEDIATE
 * preference earns a commission. Disburses via PayUnit with retries.
 */
export const immediateAffiliatePayout = inngest.createFunction(
  {
    id: "immediate-affiliate-payout",
    retries: 1,
    idempotency: "event.data.referralId",
    concurrency: [{ limit: 2, key: "event.data.affiliateId" }, { limit: 20 }],
  },
  { event: "affiliate/immediate-payout" },
  async ({ event, step }) => {
    const { referralId, affiliateId } = event.data as {
      referralId: string;
      affiliateId: string;
    };

    const referral = await step.run("fetch-referral", async () => {
      const r = await db.affiliateReferral.findUnique({
        where: { id: referralId },
        include: {
          affiliate: {
            select: {
              id: true,
              userId: true,
              payoutMethod: true,
              payoutPhone: true,
              status: true,
            },
          },
        },
      });
      if (!r || r.status !== "CONFIRMED" || r.affiliate.status !== "APPROVED")
        return null;
      return {
        id: r.id,
        commission: r.commission.toNumber(),
        affiliate: r.affiliate,
      };
    });

    if (!referral || referral.commission <= 0) return { skipped: true };

    const payoutId = `PAYOUT-IMM-${Date.now().toString(36).toUpperCase()}`;

    await step.run("process-payout", async () => {
      const disbursement = await createDisbursement({
        amount: referral.commission,
        accountNumber: referral.affiliate.payoutPhone ?? "",
        beneficiaryName: "Affiliate",
        gateway:
          referral.affiliate.payoutMethod === "ORANGE"
            ? "CM_ORANGE"
            : "CM_MTNMOMO",
        transactionId: payoutId,
      });

      await confirmDisbursement({
        payToken: disbursement.pay_token,
        message: `Immediate affiliate payout ${payoutId}`,
        notifyUrl: `${APP_URL}/api/webhooks/payunit`,
      });

      await db.$transaction(async (tx) => {
        await tx.commissionPayout.create({
          data: {
            affiliateId,
            amount: referral.commission,
            currency: "XAF",
            status: "PENDING",
            payunitDisbursementId: disbursement.pay_token,
          },
        });
        await tx.affiliateReferral.update({
          where: { id: referralId },
          data: { status: "PAID" },
        });
        await tx.affiliateProfile.update({
          where: { id: affiliateId },
          data: { totalPaid: { increment: referral.commission } },
        });
      });

      // Send payout notification email
      const user = await db.user.findFirst({
        where: { id: referral.affiliate.userId },
        select: { email: true, name: true },
      });
      if (user?.email) {
        await inngest.send({
          id: `immediate-payout-email-${affiliateId}`,
          name: "email/send",
          data: {
            to: user.email,
            subject: "Commission Payout Initiated",
            template: "payout-notification" as const,
            messageId: `immediate-payout-email-${affiliateId}-${referral.id}`,
            props: {
              affiliateName: user.name ?? "Affiliate",
              amount: Math.round(referral.commission),
              currency: "XAF",
              payoutMethod: referral.affiliate.payoutMethod,
            },
          },
        })
      }

      await createNotification({
        userId: referral.affiliate.userId,
        type: "COMMISSION",
        title: "Immediate payout processed",
        body: `Your payout of ${Math.round(referral.commission)} FCFA has been initiated.`,
        link: "/dashboard/affiliate/payouts",
      });
    });

    return { processed: true, amount: referral.commission };
  },
);
