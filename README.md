# Twin Comp AI

A multi-AI comparable sales engine for Twin Home Buyer. Open `twin-comp-ai.html` (or the published artifact) and run a property:

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
