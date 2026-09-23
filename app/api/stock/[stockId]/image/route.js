import { get } from "@vercel/blob";
import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { getStockImage } from "../../../../lib/stock";

export async function GET(request, { params }) {
  const { stockId } = await params;
  const stock = await getStockImage(stockId);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!stock || (!stock.isListed && session?.user.id !== stock.ownerId)) {
    return new Response("Not found", { status: 404 });
  }

  const pathname = new URL(stock.imageUrl).pathname.slice(1);
  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") || undefined
  });
  if (!result) return new Response("Not found", { status: 404 });
  if (result.statusCode === 304) {
    return new Response(null, { status: 304, headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" } });
  }
  if (result.statusCode !== 200) return new Response("Not found", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache"
    }
  });
}
