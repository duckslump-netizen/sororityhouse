# Finish the shop

The store has four real items (Dakota hoodie and tee, Zoe hoodie and tee) plus the
referral-only tee that stays hidden from the shop. There is also a leftover blank
item called "Untitled Sep4_13:29:41" that shoppers can currently see.

## What changes

**Clean up the store**
- Remove the leftover blank "Untitled" item so only real merch shows.

**Size picking that actually works**
- On the shop grid, "Add to cart" currently always adds the first size. Replace it
  with a size row (S, M, L, XL, 2XL) so shoppers choose before adding, and show
  sold-out sizes as unavailable.
- On the item page, group the size buttons under a clear "Size" label, show the
  price for the chosen size, and let shoppers pick how many to buy.

**Easier to shop**
- Add a basket button to the top of the home page so people can get back to their
  basket from anywhere, with a count of what's in it.
- Show a short confirmation when something is added.

**Item pages that look right when shared**
- Each item page gets its own title, description and preview picture pulled from
  the item, instead of the same generic text for every product.
- Show a small gallery when an item has more than one photo.

**Empty and error wording**
- Friendlier wording in the house voice when the shop is empty or slow to load.

## Technical notes

- Delete Shopify product 8950925557913.
- `src/routes/shop.tsx`: per-card variant state, availability-aware size buttons,
  toast on add.
- `src/routes/product.$handle.tsx`: loader-backed fetch so `head()` can emit
  product-specific title/description/`og:image` (absolute Shopify CDN URL),
  quantity stepper, image thumbnails.
- `src/routes/index.tsx`: render `<CartDrawer />` in the top nav.
- Cart store, checkout flow and `fetchProducts` tag filtering stay as they are.
