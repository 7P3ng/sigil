# Launch checklist — cc-commands

Tasks to ship this from "code on disk" to "$19 in the bank." Order matters: distribution requires the URL, the URL requires the deploy, the deploy requires Stripe.

## 1. Stripe Payment Link (~5 min, user action)

In Stripe dashboard for the new account:

1. **Products** → New product → "cc-commands premium pack" → $19 USD, one-time.
2. **Payment links** → New payment link → select the product.
3. **After payment** → Redirect customers to a specific URL → `https://cc-commands.thomaspeng.ca/thanks.html?session={CHECKOUT_SESSION_ID}`
   - The query param isn't read by v0 (we honor-system the URL), but bake it in now so we can upgrade to verified later.
4. Copy the Payment Link URL.
5. Edit `landing/index.html` — replace `STRIPE_PAYMENT_LINK_TBD` with the URL.

## 2. Deploy landing page to VPS (~10 min)

Following the standard `*.thomaspeng.ca` pattern (Caddy + systemd):

```bash
# On VPS:
sudo mkdir -p /var/www/cc-commands
sudo chown -R tpeng:tpeng /var/www/cc-commands

# From dev machine:
rsync -avz landing/ srv979561:/var/www/cc-commands/
```

Add to `/etc/caddy/Caddyfile`:

```caddy
cc-commands.thomaspeng.ca {
    root * /var/www/cc-commands
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
# Set DNS A record cc-commands.thomaspeng.ca → VPS IP (GoDaddy)
```

Wait ~5 min for DNS + Caddy auto-TLS. Verify https://cc-commands.thomaspeng.ca returns the marketing page.

## 3. GitHub repo (~5 min)

```bash
# In repo root:
git init
git add .
git commit -m "feat: initial cc-commands CLI + premium pack + landing"

gh repo create cc-commands --public --description "Generate Claude Code slash commands tailored to your repo"
git push -u origin main
```

Test the install path: `npx github:thomaspeng/cc-commands` in a clean shell on any machine should download + run + write commands.

## 4. End-to-end smoke test (~10 min)

1. Visit https://cc-commands.thomaspeng.ca on incognito.
2. Click the Buy button → reach Stripe Checkout.
3. Pay with a real $19 (your own card — refundable via Stripe dashboard).
4. Confirm redirect lands on `/thanks.html`.
5. Click the Download button — confirm the tar.gz downloads.
6. In a fresh terminal:
   ```bash
   mkdir -p ~/.cc-commands
   tar xzf ~/Downloads/cc-commands-premium-pack-v0.1.0.tar.gz -C ~/.cc-commands/
   cd /any/real/repo
   npx github:thomaspeng/cc-commands
   # Confirm premium commands render
   ```
7. Refund yourself in Stripe.

## 5. Distribution — when ready, NOT today

Day 1 (today): Code on GitHub + landing page live. Nothing more. Resist the urge to post — bad first impressions are forever.

Day 2: Use the product yourself in 3 real repos. Note any rough edges. Fix them.

Day 3: Soft post.

- **Anthropic Discord #claude-code** (highest credibility for you): "Built a CLI that auto-generates custom Claude Code slash commands from your repo's stack — sharing because I kept rewriting the same `.claude/commands/*.md` files for every project. Free CLI on GitHub, premium pack with 8 deeper commands for $19. <link>"
- **r/ClaudeAI** (50K+): "Show r/ClaudeAI: auto-generate Claude Code custom commands tailored to your repo's stack"
- **Show HN**: "Show HN: cc-commands — generate Claude Code slash commands from your repo's stack"

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
- **No npm publish.** `npx github:thomaspeng/cc-commands` works but is slower (~3s slower than `npx cc-commands`). Publish to npm on Day 2 after one good night of soak.
- **No telemetry.** Can't see actual usage. Add `posthog` or similar on Day 7+ if sales justify it.
