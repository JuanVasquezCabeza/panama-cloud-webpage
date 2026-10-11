**Tracking people has become unreliable, and the data that remains is biased toward those who consent.** Apple’s App Tracking Transparency, which arrived with iOS 14.5 in April 2021, requires apps to [ask users for permission before tracking](https://www.eff.org/deeplinks/2021/04/apples-apptrackingtransparency-upending-mobile-phone-tracking) their activity across other companies’ apps. In the first weeks after launch, [Flurry measured](https://flurry.com/blog/ios-14-5-opt-in-rate-idfa-app-tracking-transparency-weekly) an opt-in rate of about 12% of app users worldwide and 4% in the US, counting authorized taps over authorized plus denied. Flurry itself noted that early adopters may be more privacy-minded, so treat the numbers as an early signal, not a constant. The direction is clear: a click-based picture of your admissions funnel has holes, and the holes are not random.

{{widget:visibility}}

## Even where tracking works, platforms grade their own homework

**Each platform reports its own results with its own rules, and the totals rarely add up to real enrollments.** [Gordon, Zettelmeyer, Bhargava and Chapsky](https://www.kellogg.northwestern.edu/academics-research/research/detail/2019/a-comparison-of-approaches-to-advertising-measurement-evidence-from/) compared observational measurement with randomized experiments in 15 Facebook tests, and found that the observational methods often did not reproduce the experimental results. And **offline channels are invisible by construction**: radio, billboards, fairs and open days leave no click to follow, yet they often drive the decision. A funnel that cannot see them will undercount some channels and overcount others.

## What MMM uses instead

**Marketing Mix Modeling was designed around aggregate data, which is why it survives the loss of tracking.** It needs how much was invested in each channel each week and how many leads, applications and enrollments there were that week, plus a calendar. There are no individuals in that data: no cookies, no identifiers. Google’s [Meridian](https://developers.google.com/meridian) says it was built to enable “privacy-durable, advanced measurement”, and Meta’s [Robyn](https://github.com/facebookexperimental/Robyn) describes modern MMM as “a privacy-safe solution”. It does not matter whether a family accepted tracking, used a private browser, or heard about the school from a neighbor.

**Using less personal data also reduces your own exposure.** An admissions team handles information about families and minors, and data-protection rules across Latin America, such as Brazil’s LGPD, are part of the landscape. A method that needs only weekly totals needs far fewer personal data to answer the budget question. This is a design property of the method, not legal advice, and your obligations depend on your country and on the rest of how you handle data.

{{widget:needs}}

## What it does not replace

**MMM does not tell you what one family did, and it does not tune individual ads in real time.** It answers a different question, the one your budget depends on: which channels bring students and where to put the money. Click-level tools stay useful for day-to-day campaign management; the mix model is what you use to check them. Where a decision is large, a randomized test is the strongest check, as in [Google’s geo experiments](https://research.google/pubs/measuring-ad-effectiveness-using-geo-experiments/), and the result can calibrate the model. That is why the question from the first guide, which channels bring students, can no longer rest on click attribution alone.
