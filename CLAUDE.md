# Twin Comp AI — project memory

## End goal (from the user, Twin Home Buyer)

One internal valuation system that gives a defensible property value without relying on one paid comp platform or one AI's opinion.

- Enter an address once. ChatGPT, Grok, Perplexity, DeepSeek, Kimi and Claude independently research, verify, challenge, calculate and reconcile the evidence.
- The final output is only what acquisitions needs:
  - As-is value
  - Renovated ARV with a defensible range
  - Best 5–8 comps, why each was chosen, and the adjustments made
  - Confidence level, and what could make the valuation wrong
  - Recommended acquisition ceiling (max offer)
  - Source links for every material fact
- The bigger goal is a Twin Home Buyer valuation engine that gets more accurate over time. Every prediction is compared against the actual resale result.
- Workflow: **Address → AI research → verified comps → reconciled value → buy decision**
- Benchmark: **how close the predicted ARV was to the actual sale price.** The target is ±3–5% on normal properties. Flag unusual properties instead of pretending confidence, and do it in minutes.
- End state, for Juan or acquisitions:

  ```
  Estimated ARV: $1,485,000
  Defensible range: $1,450,000–$1,520,000
  As-is: $1,210,000
  Max acquisition: $1,075,000
  Confidence: 89%
  5 strongest comps verified
  ```

  The evidence sits underneath for anyone who wants to challenge the number.
- **One address in. One defensible number out. Evidence underneath. Accuracy measured against real deals.**

## Rules for every comp run

- Use only real, sourced sales. Never invent an address, price or date. If a fact can't be confirmed, say so on the page.
- **Step 1 of every run: find the listing price. No guessing.** Before any comps:
  1. Search the subject on Redfin, then Compass, Zillow and Coldwell Banker, including unit and building variants.
  2. If a listing exists, its list price is `ask`. Write the status (active, pending, Early Access or coming soon), the list date and the MLS number in `notes`, and say which site showed it.
  3. If sources disagree on price, or the MLS number points to a different property, say "listing unconfirmed" in `notes` and `flags_for_juan`. Use only the price a listing site shows, never an estimate.
  4. If nothing shows up anywhere, leave `ask` out and say "no listing found on Redfin, Compass, Zillow or Coldwell Banker".
  5. Never fill `ask` from Zestimates, Redfin estimates, tax values or your own value.
- **Always check Redfin for the subject's listing status** before calling a house off-market. Redfin blocks direct fetches from this container, so search for it:
  - `redfin <address>` and `"<address>" redfin for sale`.
  - Unit and building variants for multi-unit addresses (e.g. `327 San Jose Ave #323`, `323-327 San Jose Ave`).
  - Cross-check with Compass, Coldwell Banker and Zillow search results.

  If any of them shows an active or pending listing, use that list price as `ask` and the listing text for condition. Only write "no listing found" after all of these come up empty.
- Search the web for every run. The page has no condition picker: Claude sets the subject's condition (`cond` in `results/latest`) from the listing photos and remarks. With no listing, use Dated (2) and say so.
- **Claude is the master comper, and location comes first.** Pick and weight comps in this order:
  1. Same street or block.
  2. Within 0.25 mi, same side of any major road, freeway or rail line, same school/neighborhood boundary.
  3. Within 0.5 mi.
  4. Up to 1 mi, only if needed.

  A closer comp with a bigger size gap beats a farther "perfect" match. Say in `why` how far each comp is and what location factors it shares or doesn't (view, busy street, slope, corner, block quality).
- **Spikes.** A spike is a sale 20%+ above or below the others on $/sf once size is accounted for. Explain every spike from the listing (view, lot, ADU, luxury finish, busy street, distressed sale).
  - A spike on the subject's street or within 0.25 mi is a real location signal: use it and say so.
  - A spike farther away is an outlier: give it little weight or leave it out, and say why.
  - A market-wide spike (several recent sales all well above last year) means prices moved: weight the newest sales and apply a time adjustment, don't average it away.
  - The page flags spikes the same way (location spike, low sale nearby, outlier) and cuts the weight of far outliers.
- **Location grade and market read on every run.** Claude decides whether it's a great location and reads the market, and writes both into `claude`:
  - `location: {grade: "A"|"B"|"C"|"D", summary, pluses[], minuses[]}`.
    - **A**: best blocks (views, top schools, quiet, walkable).
    - **B**: solid residential.
    - **C**: resale drag (busy street, next to commercial, weak block, steep or odd lot).
    - **D**: location a flip can't fix (on or next to a freeway, rail line, industrial use, major arterial, flood zone, high-crime pocket).
  - `market: {trend: "rising"|"flat"|"falling", summary, median_price, yoy_pct, dom, sale_to_list_pct, sources[]}`, from the neighborhood's latest stats (Redfin neighborhood housing-market page, local market reports).

  Effect on the verdict (the page applies it):
  - **D is an automatic NO, DO NOT BUY.**
  - **C or a falling market turns a YES into NEEDS JUAN'S ATTENTION.**

  Value at today's prices; never add expected appreciation to the ARV.
- **Profit target for good locations: $100K.** For a grade A or B location, $100K net is enough: the page lowers the target from $175K to $100K when the result arrives (it never raises a lower, price-adjusted target). C and D locations keep the normal target. Say so in the reply.
- Separate as-is comps (condition 1–3) from ARV comps (condition 4–5). Use active and pending listings as competition, not as sold evidence.
- **No guessing what the seller will get.** Claude is the decision maker: decide on facts only, meaning the offer range from the comps and the asking price when there is one. Don't set `likely_sale_price` and don't write "the seller will likely get". When the ask is under the max offer (common with bait list prices), the offer range runs from the ask up to the max, and the max is the ceiling if others bid.
- Flag thin data (few 2026 sales, no dates, no condition) with lower confidence instead of false precision.
- When the default deal numbers don't fit the price point (for example a $175K profit target on a $650K house), adjust them and say so.
- **Negative profit at the asking price is an automatic "NO, DO NOT BUY" for C and D locations**, never "NEEDS JUAN'S ATTENTION". For A and B locations, the ask is only the seller's opening number: the verdict is **YES, BUY IT at our offer range** (confidence 60%+), walking away above the max. Say what Twin would make or lose at the full ask.
- Verdict words (page and replies):
  - **YES, BUY IT**: confidence 60%+, and one of:
    - no asking price (off-market: buy at the offer range);
    - an asking price at or under the max offer;
    - an A/B location with the ask over the max (offer our range, walk away above the max).
  - **NO, DO NOT BUY**: Twin would lose money at the asking price in a C or D location, a grade-D location at any price, **or the house is already renovated** (condition 4 Updated or 5 Remodeled). Renovated houses are an automatic no: set `cond` to 4 or 5 whenever the listing describes a renovated kitchen or baths.
  - **NEEDS JUAN'S ATTENTION**: confidence under 60%; a C location or falling market; or a C-location ask over the max that is still profitable.

## Profit calculator (Twin's sheet, corrected) — use on every run

Source: Twin's Google Sheet profit calculator (fileId 1Kp52OUCR2tIQI4Lj9J1Mmbq604McOMyQhEA01kbacwY). The page implements it in `dealMath()`.

- Net profit = sale − 5% commission − transfer tax on the resale − transfer tax on the purchase − reno − contingency − purchase-loan points and interest − construction-loan points and interest − property tax − staging, insurance, escrow and other − purchase price.
- Gross profit = net + Mariaelena's 2.5% (it comes back in-house). **Decide on net.**
- Fixes vs. the sheet: points are charged **once**, not prorated. The construction loan equals the reno budget, not a flat $100K. Transfer tax applies to both purchase and resale. Tiered city rates: SF, Oakland, Berkeley (2.5% above about $1.8M), San Jose Measure E, LA Measure ULA. Culver City is $5.60, not $1.10.
- **Look at the listing photos before budgeting.** Redfin blocks WebFetch, but `curl` with a desktop browser user-agent can open Redfin home pages.
  1. Get the subject's `/home/<id>` URL from search, or from the nearby-homes links on a neighbor's Redfin page.
  2. From that page, read the remarks (`marketing-remarks-scroll`), price, MLS number and agent.
  3. Download the photos (`ssl.cdn-redfin.com/photo/.../bigphoto/...jpg`) and Redfin's `longCaption` for each.
  4. Build a contact sheet with Playwright and look at every photo.

  **First question from the photos: is it already a nice house?** Well kept, move-in ready, attractive original features in good shape, recent systems. If yes, it has no flip upside even if the kitchen or baths are older but clean and working. Set `cond` to 4 (the page's automatic NO, DO NOT BUY) and say so. Don't price a remodel to manufacture a deal. Only budget a renovation when the photos show real work Twin can add value with (worn, broken, original-and-tired, fixer).

  Before you save a budget, check it:
  - Divide the total by the sq ft. If it's outside the local range ($200–250/sf in SF and the inner Bay Area), rework it, or say why in the summary.
  - Every line cites a photo number, or says "allowance, unseen".
  - Anything the photos show in fair shape (roof, siding, hardwood) gets repair or refinish money, not replacement.

  Budget only what the photos show needs work. Keep good original features (wood trim, built-ins, hardwood), and cite photo numbers in the budget lines.
- **Claude sets the renovation budget.** Build an itemized budget for the scope needed to reach the ARV comps' finish level:
  - Items: kitchen, baths, electrical, plumbing, floors, paint, exterior, windows, roof, foundation/seismic, permits, landscaping.
  - Price at local labor costs. SF and the inner Bay Area run about $200–250/sf for a full rehab.
  - Write it as `claude.reno_budget: {total, summary, items[{item, cost}]}` and set `reno` to the total. The page shows it as a Renovation budget card, and the calculator uses the total.

  The sq-ft rule is only the fallback when there's nothing to scope from: $140/sf full rehab (condition 1–2), $60/sf light (3), $30/sf touch-up (4), $0 (5).
- Loan defaults from the sheet: 100% purchase loan at 10% + 1 point, construction loan at 12% + 5 points, 3 months, property tax 1.2%/yr, escrow $1,000, other $2,000. Page adds staging $5,000, insurance $1,500 and contingency 10% of reno (the sheet had none). Adjust months for big rehabs (full rehab usually 4–6 months) and say so.
- Claude makes the call. Every reply leads with the verdict, the **offer range** (start offer to walk-away max) and **Twin's return** at both ends (net profit and % net return on total cost). Then give net profit at the asking price (if any) and the city transfer-tax rate used. The page no longer shows an as-is value box; don't lead with as-is.

## How the live page works (claude.ai artifact)

Page: https://claude.ai/artifact/FDVtVuAGpwdBwHkSSmDx71 (source: `artifact/twin-comp-ai.html`, republish it with the Artifact tool using that URL; the website version is `public/index.html` + `api/comps.js`).

1. Juan presses **Run comps**. The page writes `requests/latest` in the artifact database and sends a comment to Claude ("Run comps: <address>…"), which wakes the session.
2. On wake, write progress to `status/latest` as `{address, message, ts}`. The page shows it live ("✓ Claude got it · …").
3. Research the subject and the comps with web search.
4. Write `results/latest` as `{address, ts (new each run), cond, ask, reno, deal, replaceFacts:true, notes, claude:{arv, arv_range, as_is_value, as_is_range, confidence, top_comps[{address, weight_pct, why}], why_this_value, what_could_make_us_wrong, flags_for_juan}, result:{subject_facts, summary, value_as_is, value_arv, risks, comps[...]}}`. The page loads it automatically.
5. Set `status/latest` to "done, results loaded". Reply in the comment thread with a short summary, then resolve the thread.

Always pin database writes with `if_version`.

## Known gaps vs. the end goal

- Only Claude researches today. ChatGPT, Grok, Perplexity, DeepSeek and Kimi are not wired in yet. They need API keys in the website version.
- The deal log (predicted vs. actual) is saved per browser. Move it to the shared database so accuracy can be tracked across deals.
- Per-comp adjustments are computed by the engine but aren't shown in the top comps list yet.
- Source links cover comps, but not every subject fact.
