"use client";
import { useActionState } from "react";
import { makeOffer } from "../trades/actions";

export function OfferForm({ targets, stock, targetId }) {
  const [state, action, pending] = useActionState(makeOffer, {});
  return <form action={action} className="auth-form">
    <label>Stock you want<select name="targetId" defaultValue={targetId} required>
      <option value="">Choose listed stock</option>
      {targets.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.username}</option>)}
    </select></label>
    <fieldset><legend>Offer items from your stash</legend>
      {stock.length ? stock.map((item) => <label key={item.id}><input type="checkbox" name="offeredIds" value={item.id} />{item.name}</label>) : <p>No available stock. Add something to your stash first.</p>}
    </fieldset>
    <p>Selected items are reserved for this trade. Ownership stays with each person until both confirm the exchange.</p>
    {state.error && <p role="alert">{state.error}</p>}
    {state.success && <p role="status">{state.success}</p>}
    <button disabled={pending || !stock.length || !targets.length}>{pending ? "Making offer…" : "Make offer"}</button>
  </form>;
}
