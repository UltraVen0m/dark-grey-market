# Dark Grey Market — product spec

## Purpose and audience

Dark Grey Market is a playful stock-swapping site for Matthew and friends at school. Anyone can browse stock that users have listed publicly. Signed-in users offer their own stock for someone else's listed stock, negotiate, exchange it in person, and record the completed trade. There is no money, payment, or sale.

This is a concept-stage spec, not a description of implemented features. Matthew has chosen Next.js, PostgreSQL, Vercel, [Better Auth](https://better-auth.com/) for sign-up/sign-in, and [Resend](https://resend.com/) for trade emails. None is set up yet.

## Terms and capabilities

- **Stock:** an item uploaded by a user who says they own it, with a picture, name, and description.
- **Listed stock:** stock made publicly browsable with the owner's username and profile picture. Public visitors can browse it; signing in is required to manage stock or trade.
- Visitors can sign up or sign in. Signed-in users can manage their email, password, username, and profile picture.
- An **offer** proposes one or more pieces of the offerer's stock for one selected piece of another user's listed stock.
- The offer recipient has three responses: **Yeah Sure** accepts, **Nah** declines, and **Gimme Sumore** asks the offerer to add more stock. After Gimme Sumore, the offerer can add more stock to the same trade or cancel it.
- Both participants receive email when a trade is offered, accepted, rejected, negotiated, or completed.

## Main journey and trade lifecycle

1. A visitor browses publicly listed stock and sees its owner's username and profile picture. A signed-in user uploads and lists stock.
2. A signed-in user selects another person's listed stock and offers one or more pieces of their own stock. This starts an **active trade**; every involved item is committed to that trade and unavailable to another active trade. Both participants receive an offered-trade email.
3. The recipient chooses **Nah** to decline, **Gimme Sumore** to request more stock, or **Yeah Sure** to accept. After Gimme Sumore, the original offerer can add stock to the same active trade or cancel. Newly added stock is also committed to that trade. Both receive email about rejection, negotiation, or acceptance.
4. Acceptance makes the active trade an **agreed trade**. It remains active and its stock remains committed. Ownership does not change at acceptance. Either participant may still cancel; cancellation ends the trade for both and releases its stock.
5. After the real-life exchange, each participant clicks **Done**. One Done confirmation leaves the trade active and does not transfer ownership. After both have clicked Done, the app swaps ownership of all stock in the agreed terms, marks the trade **completed**, emails both participants, and shows it on each participant's completed trades page.

## Core rules

- Identify both participants and all stock in every offer and agreed trade. Only an owner may offer their stock. The offer recipient chooses Yeah Sure, Nah, or Gimme Sumore; after Gimme Sumore, the original offerer may add stock to the same trade or cancel it.
- An active trade starts at offer creation and includes offered, negotiated, and accepted states. Each stock item belongs to at most one active trade, from its inclusion until that trade is declined, cancelled, or completed.
- Either participant can cancel an active trade, including an accepted trade or one with a single Done confirmation. Cancellation affects both participants and releases all its stock. Declining also ends the active trade and releases its stock.
- Keep the accepted terms fixed. A proposal, a Gimme Sumore request, an acceptance, and a single Done confirmation are distinct from completion. Ownership changes only once both participants have confirmed Done.
- Each participant's completed trades page shows trades they participated in. The record should retain the accepted terms even after ownership changes.
- The app's trade record is authoritative; notification email does not itself accept, reject, negotiate, or complete a trade.

## Visual direction

Use a dark theme built around black, white, and predominantly dark grey. Stock pictures, offer terms, reservation state, and the Yeah Sure, Nah, Gimme Sumore, and Done actions should remain easy to read and distinguish. Exact colors, typography, and component styling are not yet specified.

## Privacy and suitable stock

Listed stock is public with its owner's username and profile picture. Keep email, credentials, and unlisted stock protected. Collect only information needed for accounts and trading, considering the school-age audience.

Users should trade only stock they own and consider hygiene, hazards, and school rules. A pen or rock may fit the playful tone; a toothbrush or animal waste is not automatically suitable to trade. There is no moderation feature or workflow.

## Non-goals

- Prices, money, payments, sales, shipping, or cash balances.
- Transferring ownership or declaring completion solely because an offer was accepted or one participant clicked Done.
- A moderation feature or workflow.

## Open decisions for Matthew

1. What happens after the offerer adds stock following **Gimme Sumore**: does the recipient respond again, and can they ask for more again?
2. Should cancelling an active trade notify both participants by email? The confirmed notification events are offer, acceptance, rejection, negotiation, and completion.
3. Who can sign up, and are any account safeguards needed for this school-age audience?
