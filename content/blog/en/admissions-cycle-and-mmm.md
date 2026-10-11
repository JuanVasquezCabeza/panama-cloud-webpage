**Advertising keeps working after it stops, which is why reports that compare each month’s spend with that month’s results mislead.** In their meta-analysis of 56 studies, [Sethuraman, Tellis and Briesch (2011)](https://www.gwern.net/doc/economics/advertising/2011-sethuraman.pdf) found an average short-term advertising elasticity of 0.12 and a long-term one of 0.24: over time, the effect is roughly twice what the first measurement shows. The concept goes back to Simon Broadbent, who introduced “adstock”, the carry-over of advertising, in [a 1979 paper](https://en.wikipedia.org/wiki/Advertising_adstock). Meta’s [Robyn](https://github.com/facebookexperimental/Robyn) still lets users explore adstock rates today. For admissions, where a family may take months to decide, the delay is the rule, not the exception. See it below: pick a channel and a campaign length, and watch how much of the effect lands after the campaign ends.

{{widget:carryover}}

## One window per year

**Admissions run on a calendar, and the seasonal peak is not a channel effect.** Most institutions have one big decision window, and a large share of enrollments concentrates in a few weeks. A model that ignores seasonality credits whatever channel happened to be running at the peak, when the peak would have come anyway. That is why Robyn’s approach includes [time-series decomposition for trend and season](https://github.com/facebookexperimental/Robyn). The demo below shows the same weekly applications read two ways: a simple report that credits everything above the normal level to a digital push, and a model that separates the season and the earlier awareness from the push itself.

{{widget:season}}

## What this means in practice

**The best moment to adjust the mix is months before the window, not during it.** Effects arrive late, so decisions made inside the window mostly change next year’s results. [Gartner’s 2025 survey](https://secure.businesswire.com/news/home/20250512782208/en/Gartner-2025-CMO-Spend-Survey-Reveals-Marketing-Budgets-Have-Flatlined-at-7.7-of-Overall-Company-Revenue) found 59% of CMOs saying their budget was too small, and its research lead warned that flat budgets may face in-year cuts, so being able to say early which cuts are safe matters. A model that reads the delay and the season can tell you when the signal is already there.

**Comparing years requires accounting for the calendar, and each cycle adds information.** An earlier open day or a changed enrollment date moves results from one month to another without any change in channel performance. With two or more cycles, a model separates seasonality from channel effects much better; with fewer, the initial audit evaluates what is feasible. Lagged effects are why the answer to “which channels bring students?” cannot come from the last click: the real cause happened months earlier. And seasonality gives the enrollment forecast its shape, with its peaks and valleys.
