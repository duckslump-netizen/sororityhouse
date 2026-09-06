# Start over — keep the store only

Clear the whole site back to a blank starting point, but leave the Shopify store and its products untouched.

## What gets removed

- The home page (house, doors, group photo, challenge wording, plans and pricing).
- The gallery page and all six character pages/photos.
- All chat pages: one-on-one chats and the common room.
- Sign-in, account, admin dashboard and owner tools.
- Referral/wingman rewards, message counters, tips and top-up wording.
- Stripe checkout pages and the payment webhook.
- All saved data in the backend: members, chat history, usage counts, referrals, roles and character settings.

## What stays

- Your Shopify store exactly as it is — every product, price and image stays live in Shopify.
- The store's own pages inside the site (shop listing, product page, cart and Shopify checkout), still pulling live from Shopify.
- Your ability to sign back in later if you want accounts again.

## What you end up with

A clean, near-empty site: a simple home page with your store name and a link to the shop, plus the working shop and product pages. From there you can tell me what to build next.

## Technical notes

- Delete routes: `index` content, `gallery`, `chat.$characterId`, `room`, `auth`, `account`, `admin`, `checkout.return`, `api/public/payments/webhook`.
- Delete `src/lib/characters.ts`, `src/lib/personalities.ts`, `src/content/personalities/`, entitlements, stripe libs, roles, wingman/suggestions/chat/room/admin server functions, related hooks and components (MembershipBanner, useSubscription, useMessageUsage, useCheckout, usePaymentsEnvironment).
- Delete character/marketing images in `src/assets`; keep merch artwork used by Shopify listings.
- Keep `src/lib/shopify.ts`, `src/stores/cartStore.ts`, `useCartSync`, `CartDrawer`, `/shop`, `/product.$handle`.
- New minimal `src/routes/index.tsx` with its own `head()` metadata linking to `/shop`.
- Backend: one migration dropping the app tables (profiles, messages, usage, subscriptions, referrals, user_roles, character_settings, character trust, suggestions) and their functions/triggers. Auth users are left in place.
