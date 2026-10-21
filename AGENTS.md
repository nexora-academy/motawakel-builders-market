<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Store logic lives in SECURITY DEFINER database functions (create_order, get_order_customer, admin_* helpers); prices and order totals are always computed server-side from the products table — never trust client-submitted prices or totals.
- Guest orders are protected by an access_code; the public invoice page requires orderId + access_code (or a signed-in owner/admin session via RLS). Never expose order data without one of the two.
- The admin account is a real auth user with an admin row in public.user_roles; admin privileges are checked with public.has_role() server-side, never in client storage.
- Admin credentials use the phone-number convention: an identifier without "@" signs in as <identifier>@mutawakkil.store.
- Moyasar payment integration reads MOYASAR_API_KEY inside the handler; when the key is absent the UI degrades gracefully (button explains payment is not active yet) instead of erroring.
- The site is Arabic-only RTL; UI copy is Egyptian-flavored MSA, invoice/catalog data uses Modern Standard Arabic. Do not add hardcoded color classes — use the semantic tokens in src/styles.css (sand/asphalt/amber construction palette).
