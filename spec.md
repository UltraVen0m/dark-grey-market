# Dark Grey Market — product spec

## Problem Statement

Matthew wants a fun way for people to swap things directly, inspired by trading with friends at school. A visitor needs to discover publicly listed stock; a trader needs to know exactly which stock is offered, whether an offer is still active, and what both people have agreed to. Verbal haggling and a physical handover are easy to lose track of. The app must avoid claiming a trade is complete before both participants confirm the real-life exchange. Money, payments, and sales are outside the idea.

## Solution

Dark Grey Market lets anyone browse public stock and sign up to trade. A signed-in user uploads stock they own, lists it, and offers one or more of their stock items for one listed item owned by someone else. The recipient accepts with **Yeah Sure**, declines with **Nah**, or asks for more with **Gimme Sumore**. After Gimme Sumore, the original offerer adds stock to the same trade or cancels. Each amendment returns the same three choices to the recipient, with no fixed round limit.

An offer starts an active trade. Every stock item involved belongs to at most one active trade from the moment it is included. Either participant may cancel an active trade, including after acceptance, releasing all its stock. Acceptance records agreement; it does not transfer ownership. After the physical exchange, each person clicks **Done**. Only both Done confirmations transfer ownership, mark the trade complete, and put it on each participant's completed trades page. Both participants receive email for offered, accepted, declined, negotiated, cancelled, and completed trade events.

## User Stories

1. As a visitor, I want to browse listed stock without signing in, so that I can see what people are offering.
2. As a visitor, I want to see each listing's stock picture, name, and description, so that I can identify the item.
3. As a visitor, I want to see the owner's username and profile picture on a listing, so that I know whose stock it is.
4. As a visitor, I want to sign up without a school-membership, invitation, or approval gate, so that I can join openly.
5. As an account holder, I want to sign in, so that I can manage my stock and trades.
6. As an account holder, I want to manage my email address, so that my account and trade emails reach me.
7. As an account holder, I want to manage my password, so that I can control access to my account.
8. As an account holder, I want to manage my username, so that listings show the name I use.
9. As an account holder, I want to manage my profile picture, so that listings show my chosen image.
10. As a signed-in user, I want to upload stock with a picture, name, and description, so that I can show what I own.
11. As a stock owner, I want to list my stock publicly, so that others can discover it.
12. As a stock owner, I want my unlisted stock and account details kept private, so that public browsing reveals only intended information.
13. As a trader, I want to select one listed item owned by another user, so that I can propose a specific exchange.
14. As a trader, I want to offer one or more items of my own stock for that item, so that my proposed terms are clear.
15. As a trader, I want to see both people and every stock item in an offer, so that I can judge its terms.
16. As a trader, I want making an offer to start an active trade, so that both people can track the proposal.
17. As a trader, I want every item in an active trade unavailable to other active trades, so that it cannot be promised twice.
18. As a trader, I want stock added to an active trade during negotiation to become unavailable to other active trades, so that the amended offer stays valid.
19. As an offer recipient, I want to choose **Yeah Sure**, so that I can accept the current offer.
20. As an offer recipient, I want to choose **Nah**, so that I can decline the current offer.
21. As an offer recipient, I want to choose **Gimme Sumore**, so that I can ask for more stock.
22. As the original offerer, I want to add more of my stock to the same trade after Gimme Sumore, so that I can improve my offer.
23. As the original offerer, I want to cancel after Gimme Sumore, so that I can stop negotiating.
24. As an offer recipient, I want to choose Yeah Sure, Nah, or Gimme Sumore again after an amendment, so that I can respond to the revised terms.
25. As a trader, I want the negotiation cycle to have no fixed round limit, so that we can continue until we agree or stop.
26. As an offer recipient, I want declining to end the active trade and release its stock, so that the stock can be traded elsewhere.
27. As either participant, I want to cancel an active trade before completion, so that I can withdraw even after acceptance.
28. As either participant, I want cancellation to end the trade for both people and release all its stock, so that neither remains committed.
29. As either participant, I want an accepted offer recorded as an agreed trade without changing ownership, so that the app reflects the pending physical exchange.
30. As either participant, I want the accepted stock and terms held fixed until completion or cancellation, so that agreement cannot silently change.
31. As either participant, I want to click **Done** after the real-life exchange, so that I can confirm my part of the handover.
32. As either participant, I want one Done click to leave the trade active without transferring ownership, so that the other person must confirm too.
33. As either participant, I want to be able to cancel while only one Done confirmation exists, so that an uncompleted trade can still end.
34. As either participant, I want both Done confirmations to transfer all agreed stock to its new owner and complete the trade, so that ownership reflects the exchange.
35. As either participant, I want to see that trade on my completed trades page, so that I can review what we exchanged.
36. As either participant, I want the completed record to retain the agreed terms, so that I can understand the exchange after ownership changes.
37. As an offer participant, I want an email when a trade is offered, so that I know about the new proposal.
38. As an offer participant, I want an email when a trade is accepted or declined, so that I know the recipient's decision.
39. As an offer participant, I want an email when a trade is negotiated, so that I know the terms are being discussed or amended.
40. As an offer participant, I want an email when either person cancels an active trade, so that I know the trade ended.
41. As an offer participant, I want an email when the trade is completed, so that I know both confirmations were recorded.
42. As a trader, I want the trade record to determine the trade state independently of email delivery, so that a delayed message cannot change the outcome.
43. As a user, I want readable stock pictures, terms, states, and actions in the dark theme, so that I can make decisions confidently.
44. As Matthew, I want the app to stay a direct stock-swapping experience without money or sales, so that it remains true to the idea.
45. As Matthew, I want a simple friends-app experience without a moderation workflow, so that the product stays focused on trading.

## Implementation Decisions

- The chosen app stack is Next.js, PostgreSQL, and Vercel. Better Auth is the chosen sign-up/sign-in solution; Resend is the chosen trade-email service. These are decisions, not implemented integrations. The repository currently contains documentation and no application code, dependency setup, database configuration, or deployment.
- **Stock** is an uploaded item with a picture, name, description, and owner. **Listed stock** is the subset shown publicly with the owner's username and profile picture. Email, credentials, and unlisted stock remain protected. Registration is open to anyone; there is no school-membership, invitation, or approval gate. Normal account security and access checks still apply.
- An **offer** identifies an original offerer, a recipient, one of the recipient's listed stock items, and one or more items owned by the offerer. Only owned stock may be offered. The app must show the complete terms before a decision.
- An **active trade** begins when an offer is made and persists through negotiation and agreement. Each involved stock item can belong to only one active trade at a time, beginning when it joins the trade. Adding stock after Gimme Sumore joins the existing trade and takes the same commitment. The implementation must uphold this rule even when two users act at the same time.
- The offer recipient chooses **Yeah Sure** to accept, **Nah** to decline, or **Gimme Sumore** to request more. After Gimme Sumore, the original offerer may add stock to that trade or cancel. After an amendment, the recipient again has those three choices. There is no fixed number of rounds.
- **Nah** ends the active trade and releases its stock. Either participant may cancel any active trade, including an agreed trade or one with a single Done confirmation. Cancellation ends it for both and releases all involved stock. This does not specify any reversal of a completed trade.
- **Yeah Sure** turns the active trade into an **agreed trade** with fixed accepted terms and unchanged ownership. After the real-life exchange, each participant independently clicks **Done**. One Done leaves the trade active. Only both Done confirmations transfer ownership of all agreed stock, mark a **completed trade**, and make it appear on both completed trades pages. Completion and ownership transfer must be one coherent outcome.
- Both participants receive email when a trade is offered, accepted, declined, negotiated, cancelled, or completed. The app's trade record is authoritative if email is delayed or fails.
- The visual direction is a dark theme using black, white, and predominantly dark grey. Stock pictures, trade status, terms, and action labels must remain readable and distinct. Exact colors, typography, and a component system have not been selected.
- The product is playful and inspired by school friends, but registration and public browsing are open. Users should trade only stock they own and consider hygiene, hazards, and applicable school rules. There is no moderation feature or workflow.

## Testing Decisions

- Test externally observable behavior and outcomes, rather than internal functions, database table shapes, or provider-specific implementation details.
- **Approved single test seam:** exercise the running app through its public and signed-in user flows, using two separate test accounts and an isolated test database, and observe outgoing trade emails through a controlled test inbox or equivalent boundary. This high-level seam covers browsing, account access, stock and trade flows, state changes, and notifications. No app modules or test seams exist yet; the future account, stock, trade, and notification behavior will be exercised through this app boundary.
- At that seam, cover the public/private visibility boundary; multi-item offers; stock commitment from offer creation; decline and cancellation releasing stock; repeated Gimme Sumore amendments; acceptance without ownership transfer; one Done versus two Done; completed history; both-recipient email events; and simultaneous attempts to involve the same stock in different active trades.
- There are no tests or comparable test patterns in this repository yet. Matthew approved this seam for the first implementation.

## Out of Scope

- Money, prices, payments, sales, shipping, and cash balances.
- A school-membership, invitation, or approval gate for registration.
- A moderation feature or workflow.
- Automatic completion or ownership transfer on acceptance or after only one Done confirmation.
- Reversing completed trades; this spec defines cancellation only while a trade is active.
- Pocket/shelf stock categories, moving stock between them, and a fixed negotiation-round limit.
- Exact visual tokens, typography, component designs, or vendor-specific API contracts.

## Further Notes

- Matthew owns the project. This spec synthesizes decisions already made; it is not a claim that the app works.
- A stock item may be listed publicly and committed to an active trade. Its availability to new trades must reflect the active-trade rule. The exact listing controls and post-completion display behavior are not yet specified.
- The spec does not choose an item-rule enforcement or account approval workflow. Safety guidance should remain sensible without inventing moderation.
