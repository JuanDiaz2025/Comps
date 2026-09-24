# Twin Comp AI

Juan types an address and presses **Run comps**. ChatGPT searches the web through the OpenAI API: it looks up the property, finds and verifies sold comps with source links, and flags risks. The page then scores and adjusts the comps and shows:

- **BUY / REVIEW / PASS** (or "offer up to" when there's no asking price)
- **ARV, as-is value, Twin max buy, expected profit, confidence**
- The next step: over 90% confidence goes straight to an offer. At 75–90%, Juan reviews the comps. Under 75%, or when the estimates are more than 10% apart, order a BPO.
- The main risk, active competition, and the **5 best comps with why** on a map
- **Copy for REI BlackBook** and **Save to deal log** (backtest: enter the sale price later, target ±3–5%)

Deal numbers, comp rules, adjustment rates, the full comp list and MLS CSV import are in collapsed sections Juan doesn't need to open.

## Files

| File | What it does |
|---|---|
| `public/index.html` | The whole screen and the comp math (runs in the browser) |
| `api/comps.js` | Calls ChatGPT (OpenAI Responses API with web search) and returns the comps as JSON. Your API key stays on the server. |
| `api/mock.json` | Fake sample data for testing without a key (`MOCK=1`) |
| `server.js` | Runs everything on your own computer |

## Put it online (Vercel, about 5 minutes)

1. Get an OpenAI API key at platform.openai.com → API keys. Add a payment method; each run costs cents.
2. At vercel.com, sign in with GitHub, click **Add New → Project**, and import this repo. Keep the defaults.
3. Under **Settings → Environment Variables**, add:
   - `OPENAI_API_KEY` = your key
   - `APP_PASSWORD` = a team password (strongly recommended, so strangers can't spend your credits)
   - optional: `OPENAI_MODEL` (default `gpt-5.5`), `OPENAI_REASONING` (`low` / `medium` / `high`, default `medium`)
4. Deploy. Send Juan the URL. The first run asks for the team password once.

A run usually takes 1–3 minutes, because ChatGPT is searching. `vercel.json` allows up to 5 minutes.

## Run it on your own computer

```
cp .env.example .env    # put your OPENAI_API_KEY in .env
npm start               # open http://localhost:3000
npm run mock            # try it with fake data, no key needed
```

Needs Node 18 or newer. There are no packages to install.

## Next steps

1. Backtest: run 10 houses Twin already sold (don't enter the sale price), save each one, then enter the real price in the deal log.
2. Add a second opinion: Claude as Chief Appraiser (Anthropic API), then Perplexity, Grok, Gemini and DeepSeek. Each is another call like `api/comps.js`.
3. Send the result straight to REI BlackBook and Airtable instead of copying it.
