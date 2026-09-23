"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addStock } from "../account/actions";

const initialState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Adding it…" : "Add stock"}</button>;
}

export function StockForm() {
  const [state, formAction] = useActionState(addStock, initialState);

  return (
    <form className="stock-form" action={formAction}>
      <label>Picture<input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required /></label>
      <label>Name<input name="name" maxLength="120" required /></label>
      <label>Description<textarea name="description" maxLength="2000" required /></label>
      <label className="listing-choice"><input name="isListed" type="checkbox" /> List it publicly so other people can browse it</label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-success" role="status">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
