# Dark Grey Market

Dark Grey Market is a planned, playful trading site inspired by swapping things with friends at school. Anyone can browse stock listed by others, and anyone can sign up without a school-membership, invitation, or approval gate. Signed-in users upload stock they own and arrange direct swaps, with no prices, payments, or sales.

**Stock** means items users upload. Public listings show the stock and its owner's username and profile picture.

## Intended workflow

1. A visitor browses publicly listed stock. They can sign up or sign in to trade.
2. A signed-in user manages their email, password, username, and profile picture, and uploads stock with a picture, name, and description.
3. The user selects another user's listed stock and offers one or more pieces of their own stock for it.
4. Making the offer starts an active trade. Every stock item involved belongs to that trade and is unavailable to another active trade. The recipient chooses **Yeah Sure** to accept, **Nah** to decline, or **Gimme Sumore** to ask for more. After Gimme Sumore, the original offerer can add more stock to the same trade or cancel it. If they add stock, the recipient chooses from those same three responses again; this cycle has no fixed round limit.
5. Either participant can cancel an active trade, including after acceptance; cancellation releases its stock for other trades. After an accepted trade is exchanged in real life, both participants click **Done**. Only then does the app swap ownership, mark it complete, and show it on each person's completed trades page.

Both participants receive email when a trade is offered, accepted, declined, negotiated, cancelled, or completed. Either participant's cancellation notifies both people.

## Visual direction

The planned site uses a dark theme with black, white, and predominantly dark grey.

## Run locally

This slice includes public browsing, Better Auth email/password accounts, account-profile management, and private-by-default stock uploads. Users can now make multi-item offers and view the complete terms at `/trades`. Decisions, negotiation, cancellation, and completion are subsequent slices. Signed-in users can update their username, uploaded profile picture, email, and password from `/account`; username and picture updates appear on listed stock.

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` for a local PostgreSQL database named `dark_grey_market`. Add `BETTER_AUTH_URL=http://localhost:3000` and a high-entropy `BETTER_AUTH_SECRET` of at least 32 characters.
2. Create that database: `createdb dark_grey_market`.
3. Install dependencies: `npm install`.
4. Create the schema and seed the public listings: `npm run db:migrate && npm run db:seed`.
5. Start the app: `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

From **Your account**, choose a PNG, JPEG, WebP, or GIF picture under 1 MB for your public profile, then choose the same kind of picture when adding stock alongside its name and description. Images are stored in a private Vercel Blob store; PostgreSQL stores the Blob URL with each record. The app serves a stock image only when the stock is publicly listed belongs to the signed-in requester, or is part of a trade involving that requester. It serves a profile image publicly only when its owner has listed stock, while an owner can always view their own picture. The account page retrieves stock only for the current session's user ID; a user cannot use that page to view, list, unlist, or delete another user's stock. Use **Unlist** to make listed stock private again, or **Delete stock** and **Confirm delete** to permanently remove it from your stash and public browsing. **Keep stock** cancels deletion. Deleted stock images are no longer served by the app; private Blob objects are retained in storage (automatic cleanup is not implemented).

The public query selects only listed stock, its name, description, image, owner's username, and owner's profile image. It intentionally does not select email or credential data. Better Auth stores password hashes, accounts, sessions, and verification records in its own tables; its account page checks the current session on the server before rendering private details.

## Verify

`npm test` runs unit and component tests. The smoke suite starts from a production build against an isolated PostgreSQL database, resets it, migrates it, and seeds it. Set `TEST_DATABASE_URL` in `.env.local` to a database whose name ends in `_test`, then create it and run:

```sh
createdb dark_grey_market_test
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/dark_grey_market_test npm run test:smoke
```

The smoke tests verify a visitor can see persisted listed stock and owner public profiles, while a seeded unlisted item and seed email addresses are absent. They also create separate email/password accounts, confirm signed-out visitors are redirected from `/account`, verify a returning user can sign in again, and upload both a private and a public item through the running app. Run every required check with `npm run test:all`.

## Deploy to Vercel

1. Import this repository into Vercel. It detects Next.js through `vercel.json`.
2. Create or connect a PostgreSQL database, then add its pooled connection string as the `DATABASE_URL` environment variable for Preview and Production.
3. In the project’s **Storage** tab, create a **private** Vercel Blob store and connect it to Preview, Production, and Development. Vercel adds `BLOB_STORE_ID` and its managed `VERCEL_OIDC_TOKEN` to connected deployments; use `vercel env pull` to obtain local development credentials. Do not expose a Blob token to the browser.
4. Run `npm run db:migrate` and `npm run db:seed` once against that database (for example, locally with Vercel's pulled environment variables, or through a controlled deployment migration step). If the database contains uploads from the earlier embedded-image implementation, run `npm run db:migrate:stock-images` once after the Blob environment is available; it migrates only `data:` image records and is safe to rerun.
5. Deploy. The root route renders the public browse page using `DATABASE_URL`.

Do not use the test database URL in Vercel. Add `BETTER_AUTH_URL` for the deployed app's URL and a unique high-entropy `BETTER_AUTH_SECRET` for each environment. Configure `RESEND_API_KEY`, `TRADE_EMAIL_FROM` (a verified Resend sender), and a random `CRON_SECRET`.

This is a fun friends' app without a moderation workflow. Users should trade only stock they own and consider hygiene, safety, and school rules where applicable; a playful example is not automatically suitable.

## Trade offers and email delivery

Run migrations before starting the updated app. From a listing choose **Make an offer**, select one or more available items from your stash, then submit. **Your trades** shows both participants the names, descriptions, and pictures of all involved items. Listed committed items remain publicly browsable with an unavailable status. Unlisting does not release a commitment; deletion is blocked for stock referenced by trade history.

An offer transaction locks stock in ID order, checks ownership, listing status and availability, then saves the trade, terms, exclusive stock commitments and two pending emails together. Ownership does not change. Only participants can read private trade terms and images.

Set `RESEND_API_KEY` and `TRADE_EMAIL_FROM` to enable offered-trade notifications. Delivery runs after the response; failures remain in `trade_emails` with no `sent_at`. The authenticated `GET /api/trade-emails` endpoint retries pending notifications; send `Authorization: Bearer <CRON_SECRET>`. Vercel invokes it daily at 08:00 UTC, and new offers also trigger delivery. Monitor pending rows operationally. Resend idempotency keys reduce duplicate delivery on retries (Resend retains these for 24 hours; a retry after that window can duplicate an email). `RESEND_API_URL` is an optional server-side transport override used by the controlled local test inbox; leave it unset in deployments.

The offer browser test creates two isolated accounts, races overlapping multi-item offers, checks both participants' terms and unchanged ownership, and verifies that failed emails remain pending before recovering delivery to both addresses. The smoke runner starts a local test inbox at port 3101 and overrides Resend credentials so it never sends real trade emails. Run with the test environment loaded:

```sh
node --env-file=.env.local --run test:all
```

Alternatively export `TEST_DATABASE_URL` and the Blob test credentials before `npm run test:all`. Existing upload smoke tests still require a dedicated test Blob store. The test database is reset on each run and must end in `_test`.
