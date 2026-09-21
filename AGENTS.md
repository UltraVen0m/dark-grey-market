# Agent instructions

## Product intent and terms

Build Dark Grey Market as a playful stock-swapping app inspired by school friends, with publicly browsable listed stock. Anyone can sign up without a school-membership, invitation, or approval gate. Users sign in to manage their stock and make direct swaps. There are no prices, payments, sales, or cash balances.

- **Stock:** items a user uploads and says they own; each has a picture, name, and description.
- **Listed stock:** stock made publicly browsable with its owner's username and profile picture. Keep email, credentials, and unlisted stock private.
- **Offer:** one or more pieces of the offerer's stock proposed for one selected piece of another user's listed stock.
- **Active trade:** begins when an offer is made. Every involved stock item belongs to only that active trade, including any stock added later. It remains active while offered, being negotiated, or accepted, until declined, cancelled, or completed.
- **Negotiation:** after **Gimme Sumore**, the original offerer can add more of their stock to that same trade or cancel it. After an amendment, the recipient can again choose **Yeah Sure**, **Nah**, or **Gimme Sumore**. Repeat as often as the participants choose; there is no fixed round limit.
- **Agreed trade:** an active trade accepted via **Yeah Sure**. Ownership has not changed.
- **Completed trade:** an agreed trade after the real-life exchange and **Done** confirmation from both participants. Only then swap ownership and show the trade on each participant's completed trades page.

## Current project state

Matthew has chosen Next.js, PostgreSQL, and Vercel, plus [Better Auth](https://better-auth.com/) for sign-up/sign-in and [Resend](https://resend.com/) for trade emails. As of 20 September 2026, this Git repository has documentation only: no application code, configuration, dependencies, tests, or deployment. Treat these as decisions, not working integrations. Update README.md with real setup and verification steps when implementation begins.

## Product and implementation guidance

- Public visitors can browse listed stock with the owner's username and profile picture. Keep email, credentials, and unlisted stock protected.
- Keep registration open to anyone while protecting accounts with normal authentication, credential handling, and access checks. Do not add a school-membership, invitation, or approval gate.
- Signed-in users manage email, password, username, and profile picture, and upload stock with picture, name, and description. Check ownership when listing or offering stock.
- Keep offer terms, participant decisions, active-trade stock commitments, both Done confirmations, and ownership transfer explicit. An item cannot belong to two active trades. A single Done click must never transfer ownership or mark the trade complete.
- Either participant can cancel any active trade, even after acceptance and one Done click, until both have confirmed completion. Cancellation ends the trade for both and releases its stock. Declining an offer also ends that trade and releases its stock.
- Email both participants when a trade is offered, accepted, declined, negotiated, cancelled by either participant, or completed. Keep the app's trade state authoritative if email delivery is delayed or fails.
- Keep the app playful and suitable for its intended audience. Users should consider ownership, hygiene, hazards, and school rules where applicable; quirky examples are not blanket permission to trade them. Do not add a moderation feature or workflow.
- Keep unresolved behavior visible in spec.md rather than silently choosing it. Do not add reversal of completed trades without a product decision.
- Follow Matthew's dark visual direction: use black, white, and predominantly dark grey. Keep stock images, trade status, and action labels readable and distinct within that theme. No exact palette, typography, or design system has been chosen.

## Pull requests

- Always create pull requests in READY state.
- Always reply to and resolve pull request comments after addressing them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
