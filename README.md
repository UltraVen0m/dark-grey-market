# Dark Grey Market

Dark Grey Market is a planned, playful trading site for Matthew and friends at school. Anyone can browse stock listed by others. Signed-in users upload stock they own and arrange direct swaps, with no prices, payments, or sales.

**Stock** means items users upload. Public listings show the stock and its owner's username and profile picture.

## Intended workflow

1. A visitor browses publicly listed stock. They can sign up or sign in to trade.
2. A signed-in user manages their email, password, username, and profile picture, and uploads stock with a picture, name, and description.
3. The user selects another user's listed stock and offers one or more pieces of their own stock for it.
4. Making the offer starts an active trade. Every stock item involved belongs to that trade and is unavailable to another active trade. The recipient chooses **Yeah Sure** to accept, **Nah** to decline, or **Gimme Sumore** to ask for more. After Gimme Sumore, the offerer can add more of their stock to the same trade or cancel it.
5. Either participant can cancel an active trade, including after acceptance; cancellation releases its stock for other trades. After an accepted trade is exchanged in real life, both participants click **Done**. Only then does the app swap ownership, mark it complete, and show it on each person's completed trades page.

Both participants receive email when a trade is offered, accepted, rejected, negotiated, or completed.

## Visual direction

The planned site uses a dark theme with black, white, and predominantly dark grey.

## Technical direction and current state

Matthew has chosen Next.js, PostgreSQL, Vercel, [Better Auth](https://better-auth.com/) for sign-up/sign-in, and [Resend](https://resend.com/) for trade emails. These are decisions, not installed or configured services. This directory contains product documentation only: there is no application code, dependency manifest, database configuration, test suite, deployment, or runnable setup yet.

This is a fun friends' app without a moderation workflow. Users should trade only stock they own and consider hygiene, safety, and school rules; a playful example is not automatically suitable. Add actual installation, configuration, run, and test instructions here when implementation begins.
