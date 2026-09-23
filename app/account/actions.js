"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { auth } from "../lib/auth";
import { createStock, listStock as persistListedStock } from "../lib/stock";

const MAX_IMAGE_BYTES = 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const IMAGE_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export async function addStock(_previousState, formData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Please sign in before adding stock." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const image = formData.get("image");

  if (!name || !description) return { error: "Give your stock both a name and a description." };
  if (name.length > 120) return { error: "Keep the stock name to 120 characters or fewer." };
  if (description.length > 2_000) return { error: "Keep the description to 2,000 characters or fewer." };
  if (!image || typeof image.arrayBuffer !== "function" || !IMAGE_TYPES.has(image.type)) {
    return { error: "Choose a PNG, JPEG, WebP, or GIF picture." };
  }
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    return { error: "Choose a picture smaller than 1 MB." };
  }

  const blob = await put(`stock/${session.user.id}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[image.type]}`, image, {
    access: "private",
    contentType: image.type
  });
  await createStock({
    ownerId: session.user.id,
    name,
    description,
    imageUrl: blob.url,
    isListed: formData.get("isListed") === "on"
  });

  revalidatePath("/");
  revalidatePath("/account");
  return { success: "Stock added to your stash." };
}

export async function listStock(_previousState, formData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Please sign in before listing stock." };

  const stockId = String(formData.get("stockId") || "");
  const stock = await persistListedStock({ stockId, ownerId: session.user.id });
  if (!stock) return { error: "That stock is not in your stash." };

  revalidatePath("/");
  revalidatePath("/account");
  return { success: "Stock listed publicly." };
}
