# Roadmap

## Done
- [x] Landing page + sorority-house pivot (hero, six girls, 12-door hallway)
- [x] Expandable character system (src/lib/characters.ts + personality files)
- [x] Accounts, Founders ($9.99) and Full House ($14.99) products, hosted checkout, billing portal, webhooks, entitlements (sandbox verified)
- [x] Real chat: per-girl chat window, message history, free 100-message trial counter, plan gating for Sasha + Piper

## Now
- [ ] Stripe live mode: user must finish go-live in the Payments tab (live keys/webhook are provisioned automatically after that)
- [x] Payment gap fixes: Stripe tax/compliance on checkout, product tax codes (admin sync), site-wide test-mode notice, free-message counter everywhere, past-due grace banner
- [ ] Stripe go-live form + live end-to-end verification (user action in Payments tab)

## Later
- [ ] Trust levels driving unlocks + real scoreboard data
- [ ] Shared house conversations (multiple girls in one chat)

- [x] Shared common room (/room) — whole house in one conversation

## Shop
- [x] Shopify dev store connected + /shop and /product/$handle with real cart & checkout
- [ ] Add merch products (hoodies, tees) to the store

- [ ] User asked: move membership payments off Stripe to Shopify (needs Shopify subscription app + claimed store)

## Pricing revamp (Sep 4)
- [x] Storyline Challenge $14.99/mo + All Site Access $19.99/mo (2,000 messages/mo cap)
- [x] Free trial cut to 25 messages + monthly AI spend ceiling
- [x] Suggest-a-girl add-on $4.99/mo
- [x] Message top-up: 1,000 extra messages for $7 (one-time)
- [x] Bring a Wingman referral rewards
- [x] Group photo of the girls with locked faces blurred
- [x] Suggested girls can be private or shared with the house; sharing earns one free suggestion
