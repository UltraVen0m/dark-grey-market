"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { listStock } from "../account/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Listing it…" : "List publicly"}</button>;
}

export function StockListingControl({ stockId }) {
  const [state, formAction] = useActionState(listStock, {});

  return <form className="listing-control" action={formAction}>
    <input name="stockId" type="hidden" value={stockId} />
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <SubmitButton />
  </form>;
}
