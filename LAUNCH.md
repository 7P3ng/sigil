# Launch checklist — sigil

Tasks to ship this from "code on disk" to "$19 in the bank." Order matters: distribution requires the URL, the URL requires the deploy, the deploy requires Stripe.

## 1. Stripe Payment Link (~5 min, user action)

In Stripe dashboard for the new account:

1. **Products** → New product → "Sigil premium pack" → $19 USD, one-time.
2. **Payment links** → New payment link → select the product.
3. **After payment** → Redirect customers to a specific URL → `https://sigil.thomaspeng.ca/thanks.html?session={CHECKOUT_SESSION_ID}`
   - The query param isn't read by v0 (we honor-system the URL), but bake it in now so we can upgrade to verified later.
4. Copy the Payment Link URL.
5. Edit `landing/index.html` — replace `STRIPE_PAYMENT_LINK_TBD` with the URL.

## 2. Deploy landing page to VPS (~10 min)

Following the standard `*.thomaspeng.ca` pattern (Caddy + systemd):

```bash
# On VPS:
sudo mkdir -p /var/www/sigil
sudo chown -R tpeng:tpeng /var/www/sigil

# From dev machine:
rsync -avz landing/ srv979561:/var/www/sigil/
```

Add to `/etc/caddy/Caddyfile`:

```caddy
sigil.thomaspeng.ca {
    root * /var/www/sigil
    file_server
    encode gzip

    # Cache static assets aggressively, never cache HTML.
    @static path *.css *.js *.png *.svg *.ico *.tar.gz
    header @static Cache-Control "public, max-age=31536000, immutable"
    @html path *.html
    header @html Cache-Control "no-cache"
}
```

Then:

```bash
sudo systemctl reload caddy
# Set DNS A record sigil.thomaspeng.ca → VPS IP (GoDaddy)
```

Wait ~5 min for DNS + Caddy auto-TLS. Verify https://sigil.thomaspeng.ca returns the marketing page.

## 3. GitHub repo (~5 min)

```bash
# In repo root:
git init
git add .
git commit -m "feat: initial sigil CLI + premium pack + landing"

gh repo create sigil --public --description "Generate Claude Code slash commands tailored to your repo"
git push -u origin main
```

Test the install path: `npx github:7P3ng/sigil` in a clean shell on any machine should download + run + write commands.

## 4. End-to-end smoke test (~10 min)

1. Visit https://sigil.thomaspeng.ca on incognito.
2. Click the Buy button → reach Stripe Checkout.
3. Pay with a real $19 (your own card — refundable via Stripe dashboard).
4. Confirm redirect lands on `/thanks.html`.
5. Click the Download button — confirm the tar.gz downloads.
6. In a fresh terminal:
   ```bash
   mkdir -p ~/.sigil
   tar xzf ~/Downloads/sigil-premium-pack-v0.1.0.tar.gz -C ~/.sigil/
   cd /any/real/repo
   npx github:7P3ng/sigil
   # Confirm premium commands render
   ```
7. Refund yourself in Stripe.

## 5. Distribution — when ready, NOT today

Day 1 (today): Code on GitHub + landing page live. Nothing more. Resist the urge to post — bad first impressions are forever.

Day 2: Use the product yourself in 3 real repos. Note any rough edges. Fix them.

Day 3: Soft post.

- **Anthropic Discord #claude-code** (highest credibility for you): "Built a CLI that auto-generates custom Claude Code slash commands from your repo's stack — sharing because I kept rewriting the same `.claude/commands/*.md` files for every project. Free CLI on GitHub, premium pack with 8 deeper commands for $19. <link>"
- **r/ClaudeAI** (50K+): "Show r/ClaudeAI: auto-generate Claude Code custom commands tailored to your repo's stack"
- **Show HN**: "Show HN: sigil — generate Claude Code slash commands from your repo's stack"

Don't fire all three on day 3. Discord first (warmest audience), see the reception, then Show HN 24-48h later if Discord goes well, then r/ClaudeAI.

## 6. Day-7 retrospective

After 7 days, look at:

- How many downloads of the CLI from npx?
- How many `/thanks.html` page views (track via Caddy access log)?
- How many sales?
- Refund rate?
- What's the most common detection miss / template gap?

Decide: double down (more templates, npm publish) or stop (move on).

## Known v0 tradeoffs

- **Honor-system download.** Anyone who guesses `/thanks.html?session=...` URL can download without paying. At $19 + low volume this is fine; upgrade to Stripe webhook → unique signed URL when monthly sales > 50.
- **No npm publish.** `npx github:7P3ng/sigil` works but is slower (~3s slower than `npx sigil`). Publish to npm on Day 2 after one good night of soak.
- **No telemetry.** Can't see actual usage. Add `posthog` or similar on Day 7+ if sales justify it.

## 5b. Day 7-14 — Reposition `thomaspeng.ca` as the indie-shop parent

We chose Path A (subdomains under `thomaspeng.ca`) over Path B (buying `peng.works`). It's $0, reversible, and matches the Pieter Levels / `levels.io` indie pattern. To make the subdomain approach work long-term, `thomaspeng.ca` itself needs to stop reading as a personal site and start reading as a product shop.

Spend 2-3 hours rebuilding the homepage to this brief:

### Homepage brief — `thomaspeng.ca`

**Above the fold**
- One-sentence tagline: "I ship small, sharp products for developers and operators."
- Sub-paragraph: 2 sentences, what you build + who buys it.
- 2 muted secondary links: `↳ Blog` · `↳ Contact`

**Products grid (3-column desktop, 1-column mobile)**

Each card:
- Product name (large, sans, bold)
- One-sentence pitch — what + for whom + price
- One product screenshot or animated preview
- Primary CTA: `Visit →` or `Buy $19 →`
- Tiny status badge: `Active` · `Coming soon` · `Sunset`

Day-1 cards:
- **Sigil** — "Claude Code slash commands tailored to your repo. $19." → `sigil.thomaspeng.ca`
- **Toastcraft** — "Wedding speech writer. $39 one-time." → `toastcraft.co`
- Placeholder slot for the next product

**Footer**
- About (3 sentences max): who, where, what you don't do.
- Social: GitHub, X, Email.
- Built-with line.

**Omit:**
- Blog posts on the homepage. Link to `/blog` from nav; don't surface posts above products.
- A Services section — your agency work (Roux) lives at `rouxagency.com`, not here. Don't dilute the indie-shop signal.
- Resume / CV — link from About if you want, never primary.
- Hero animations / over-designed flourishes. Plain typesetting outperforms.

**Visual direction**
- Inter font (matches Sigil's landing — continuity across the portfolio is a feature)
- Dark mode by default + light mode toggle, matching Sigil's palette
- No images other than product screenshots
- Generous whitespace
- All-monospace product names if you want a tighter aesthetic

**Tech**
- A single static HTML page is sufficient. Deploy wherever `thomaspeng.ca` is currently hosted (DNS shows it's on AWS/CloudFront, not the Hostinger VPS).
- If you'd rather use Next.js for forward-compatibility with future dynamic features (form, search), do it — but don't over-engineer for v1.

### When to reconsider Path B (buy `peng.works`)

Re-evaluate when any one of these is true:

- 3rd product shipped under `thomaspeng.ca` and all 3 have ≥1 sale.
- Combined product MRR across all subdomains hits **$200/mo**.
- A consulting / hiring / personal-brand pipeline emerges that you want to NOT mix with product noise.

Until then, every new product just slots into the existing `*.thomaspeng.ca` portfolio. No more domain decisions to make.

## 5c. DNS prerequisite (do this before §2 deploy)

`thomaspeng.ca` resolves to AWS (`15.197.148.33` / `3.33.130.190`) — NOT the Hostinger VPS. The root site is hosted separately. That's fine; the convention from memory (`reference_vps_deploy_pattern.md`) is that **subdomains** of `thomaspeng.ca` go to the VPS.

So before §2 Caddy deploy, you need to add a DNS A record in GoDaddy:

```
Name:  sigil
Type:  A
Value: <VPS public IP — same one used by other *.thomaspeng.ca subdomains>
TTL:   1 hour
```

Verify with `dig +short sigil.thomaspeng.ca A` from your laptop — should return the VPS IP within ~10 min. Then proceed with §2.
