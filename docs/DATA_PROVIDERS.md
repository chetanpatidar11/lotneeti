# LotNeeti data providers — founder beta

## K02 GMP policy — resolved locally on 2026-09-28

The Founder approved these editable beta defaults:

| Setting | Default | Founder Admin control |
| --- | --- | --- |
| GMP freshness limit | 24 hours | `/admin/gmp-policy/` |
| GMP source conflict threshold | 5.00 GMP percentage points, measured against the IPO's effective upper price band | `/admin/gmp-policy/` |

The MFA-gated Founder Admin policy page saves both values with a required reason and audit event. The IPO data exceptions page at `/admin/ipo-exceptions/` lists published IPOs with missing GMP, stale GMP sources or a GMP source conflict. The member IPO API and screen expose current GMP state, fresh source count, stale source count and conflict state.

For each enabled provider, the latest observation by observed/fetched time is its current candidate. A candidate is fresh when its observation age is at least zero and **less than** the configured limit; at exactly 24 hours under the default, it is stale. Stale and disabled sources do not enter consensus. An older observation from the same provider does not add another vote. All source records remain immutable and visible in history, including stale, disabled and conflicting observations.

With one or more fresh enabled candidates, current GMP is their exact median value per share. A conflict is marked when at least two candidates exist and `(highest raw GMP − lowest raw GMP) × 100 ÷ effective IPO upper price` is at least the configured threshold. A conflict remains visible while the median is served; the sources are not silently removed. The conflict comparison uses original source values, so a Founder correction does not hide disagreement.

An active Founder correction on a current fresh enabled observation takes precedence over the median. An active provider temporary value is the fallback correction when no observation correction is active. If several corrections are active, the most recently created observation correction wins; otherwise the most recently updated provider correction wins. Stale, disabled and superseded observations cannot supply a current correction. Correction expiry or resume returns current GMP to the fresh-source median. The raw source value and corrected effective value are both exposed in GMP history.

No fresh candidate means current GMP is unavailable. Automatic threshold selection then has no GMP input; manual APPLY/SKIP still outrank automation as Planner v2 requires. Planner snapshots resolve GMP at their explicit `as_of` time. The policy changes selection input and display; it does not alter the planner's financial calculations.

## Source integration boundary

The normalized NSE/BSE/SEBI IPO feed adapters accept fixture or permitted-feed records with explicit links to canonical IPOs. Snapshots are immutable and review-only. Live fetching, redistribution and promotion of source IPO facts still require approved feed access, field schema and rights. K02 GMP consensus does not grant those permissions or define a merge precedence for exchange IPO fields. No production feed or AWS deployment was changed by this local work.
