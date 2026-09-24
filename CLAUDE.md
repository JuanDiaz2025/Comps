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
- Search the web for every run. The subject's own listing text decides condition, even when the requested condition differs. Say when you override it.
- Separate as-is comps (condition 1–3) from ARV comps (condition 4–5). Use active and pending listings as competition, not as sold evidence.
- Treat SF and Bay Area list prices as bait. When overbids are typical, set a likely sale price and decide on that price, not on the ask.
- Flag thin data (few 2026 sales, no dates, no condition) with lower confidence instead of false precision.
- When the default deal numbers don't fit the price point (for example a $175K profit target on a $650K house), adjust them and say so.
- **Negative expected profit at the likely or asking price is an automatic FAIL.** Never present it as REVIEW or NEGOTIATE.
- The listing and market data decide the likely sale price. A requested condition that contradicts the listing is shown as a what-if in the reply, not used for the verdict. Base the likely price on the local sale-to-list ratio (North Berkeley about 140% of list in 2026).

## How the live page works (claude.ai artifact)

Page: https://claude.ai/artifact/FDVtVuAGpwdBwHkSSmDx71 (source: `artifact/twin-comp-ai.html`, republish it with the Artifact tool using that URL; the website version is `public/index.html` + `api/comps.js`).

1. Juan presses **Run comps**. The page writes `requests/latest` in the artifact database and sends a comment to Claude ("Run comps: <address>…"), which wakes the session.
2. On wake, write progress to `status/latest` as `{address, message, ts}`. The page shows it live ("✓ Claude got it · …").
3. Research the subject and the comps with web search.
4. Write `results/latest` as `{address, ts (new each run), cond, ask, reno, deal, replaceFacts:true, notes, claude:{arv, arv_range, as_is_value, as_is_range, confidence, likely_sale_price, top_comps[{address, weight_pct, why}], why_this_value, what_could_make_us_wrong, flags_for_juan}, result:{subject_facts, summary, value_as_is, value_arv, risks, comps[...]}}`. The page loads it automatically.
5. Set `status/latest` to "done, results loaded". Reply in the comment thread with a short summary, then resolve the thread.

Always pin database writes with `if_version`.

## Known gaps vs. the end goal

- Only Claude researches today. ChatGPT, Grok, Perplexity, DeepSeek and Kimi are not wired in yet. They need API keys in the website version.
- The deal log (predicted vs. actual) is saved per browser. Move it to the shared database so accuracy can be tracked across deals.
- Per-comp adjustments are computed by the engine but aren't shown in the top comps list yet.
- Source links cover comps, but not every subject fact.
