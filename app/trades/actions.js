"use server";
import { headers } from "next/headers";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "../lib/auth";
import { createOffer, OfferError } from "../lib/trades";
import { deliverTradeEmails } from "../lib/trade-emails";

export async function makeOffer(_previousState, formData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Please sign in before making an offer." };
  try {
    await createOffer({ offererId: session.user.id, targetId: formData.get("targetId"), offeredIds: formData.getAll("offeredIds") });
  } catch (error) {
    if (error instanceof OfferError) return { error: error.message };
    throw error;
  }
  after(async () => {
    try { await deliverTradeEmails(); } catch { console.error("Trade emails remain pending; delivery will retry."); }
  });
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/trades");
  return { success: "Offer made. Your stock is committed to this trade; ownership has not changed." };
}
