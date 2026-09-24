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
- Separate as-is comps (condition 1–3) from ARV comps (condition 4–5). Use active and pending listings as competition, not as sold evidence.
- **No guessing what the seller will get.** Claude is the decision maker: decide on facts only, meaning the offer range from the comps and the asking price when there is one. Don't set `likely_sale_price` and don't write "the seller will likely get". When the ask is under the max offer (common with bait list prices), the offer range runs from the ask up to the max, and the max is the ceiling if others bid.
- Flag thin data (few 2026 sales, no dates, no condition) with lower confidence instead of false precision.
- When the default deal numbers don't fit the price point (for example a $175K profit target on a $650K house), adjust them and say so.
- **Negative expected profit at the asking price is an automatic "NO, DO NOT BUY".** Never present it as "NEEDS JUAN'S ATTENTION".
- Verdict words (page and replies):
  - **YES, BUY IT**: confidence 60%+ and either no asking price (off-market: buy at the offer range) or an asking price at or under the max offer.
  - **NO, DO NOT BUY**: Twin would lose money (negative net profit) at the asking price, **or the house is already renovated** (condition 4 Updated or 5 Remodeled). Renovated houses are an automatic no: set `cond` to 4 or 5 whenever the listing describes a renovated kitchen or baths.
  - **NEEDS JUAN'S ATTENTION**: the asking price is over the max offer but still profitable, or confidence is under 60%.

## Profit calculator (Twin's sheet, corrected) — use on every run

Source: Twin's Google Sheet profit calculator (fileId 1Kp52OUCR2tIQI4Lj9J1Mmbq604McOMyQhEA01kbacwY). The page implements it in `dealMath()`.

- Net profit = sale − 5% commission − transfer tax on the resale − transfer tax on the purchase − reno − contingency − purchase-loan points and interest − construction-loan points and interest − property tax − staging, insurance, escrow and other − purchase price.
- Gross profit = net + Mariaelena's 2.5% (it comes back in-house). **Decide on net.**
- Fixes vs. the sheet: points are charged **once**, not prorated. The construction loan equals the reno budget, not a flat $100K. Transfer tax applies to both purchase and resale. Tiered city rates: SF, Oakland, Berkeley (2.5% above about $1.8M), San Jose Measure E, LA Measure ULA. Culver City is $5.60, not $1.10.
- Reno from sq ft: $140/sf full rehab (condition 1–2), $60/sf light (3), $30/sf touch-up (4), $0 (5). Leave `reno` out of `results/latest` so the page applies this rule; set it only when the listing justifies a different number, and say why.
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
