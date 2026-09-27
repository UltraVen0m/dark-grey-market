"use client";

import { useActionState, useState } from "react";
import { listStock, unlistStock, deleteStock } from "../account/actions";

export function StockListingControl({ stockId, isListed = false, stockName }) {
  const [confirming, setConfirming] = useState(false);
  const [listingState, listingAction, listingPending] = useActionState(isListed ? unlistStock : listStock, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteStock, {});
  const pending = listingPending || deletePending;

  return <div className="listing-control">
    <form action={listingAction}>
      <input name="stockId" type="hidden" value={stockId} />
      {listingState.error && <p className="form-error" role="alert">{listingState.error}</p>}
      {listingState.success && <p className="form-success" role="status">{listingState.success}</p>}
      <button type="submit" disabled={pending || confirming}>
        {listingPending ? "Saving…" : isListed ? "Unlist" : "List publicly"}
      </button>
    </form>
    {confirming ? <form action={deleteAction}>
      <input name="stockId" type="hidden" value={stockId} />
      <p>Delete {stockName || "this stock"} from your stash? This cannot be undone.</p>
      {deleteState.error && <p className="form-error" role="alert">{deleteState.error}</p>}
      <button type="submit" disabled={pending}>{deletePending ? "Deleting…" : "Confirm delete"}</button>{" "}
      <button type="button" disabled={pending} onClick={() => setConfirming(false)}>Keep stock</button>
    </form> : <button type="button" disabled={pending} onClick={() => setConfirming(true)}>Delete stock</button>}
  </div>;
}
