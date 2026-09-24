# Twin Comp AI

A multi-AI comparable sales engine for Twin Home Buyer. **The goal: one address in, one trusted valuation out.** That means one ARV, five comps, one confidence score and one buy price.

The main screen has three steps: **1. The property** (address, condition, asking price, reno budget), **2. Get the comps** (copy a prompt to each AI, paste the answers back), **3. The answer** (BUY / REVIEW / PASS, ARV, as-is, max offer, expected profit, confidence, main risk, the 5 best comps with a map, Claude check, copy for REI BlackBook). Everything below is under the collapsed sections.

Escalation rule: confidence over 90% goes straight to an offer. At 75–90%, Juan reviews the comps. Under 75%, or when the AIs are more than 10% apart, order a BPO or desktop appraisal. Backtest target: ±3–5% error against the actual sale price.

Details:

1. **Subject file**: address, lat/lng, beds, baths, sf, lot, year, current condition (1–5), comp rules.
2. **Research agents**: copy the role-specific prompt into each AI and paste its JSON reply back.
   - ChatGPT: Appraiser (traditional comp search)
   - Perplexity: Investigator (verifies facts and sources, flags conflicts)
   - Grok: Devil's advocate (evidence for a lower and a higher value)
   - Gemini / Kimi: Micro-market (boundaries, streets, schools, views)
   - DeepSeek: Quant (gets the cleaned pool and does the math; can suggest adjustment rates)
   - MLS / CSV: paste your own export. This is your ground truth.
3. **Comp pool**: comps are de-duplicated by address. Each one shows how many AIs found it, whether it has a source, fact conflicts between agents, and why the rules rejected it.
4. **Engine**: 100-point similarity score (location 30, size 20, type 15, condition 15, bed/bath 7, lot 5, recency 5, AI consensus 3). Paired adjustments cover time, GLA, beds, baths, lot and condition. The value is a score²-weighted average of the adjusted top N comps, run twice: once as-is and once as ARV at the target renovated condition. Confidence comes from dispersion, comp count, average score and gross adjustment. A method check compares weighted, median, trimmed mean, $/sf and nearest-neighbor results.
5. **Claude, Chief Appraiser**: reconciles the evidence and does not average opinions. It runs in-page on claude.ai, or you can copy the prompt.
6. **Twin buy price**: ARV minus reno, selling costs, holding, contingency and profit gives the max offer, with a BUY / REVIEW / PASS verdict against the asking price.
7. **Deal log & backtest**: save each valuation, then enter the actual sale price later to track engine, Claude and Juan error.

The example Berkeley data is placeholder, not verified sales.
