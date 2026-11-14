# CRM phone lookup URLs

`/admin/crm/?tab=all&phone=447366038559&phoneDNIS=447447707829`
automatically searches All Leads for the selected phone. The same selection is
used by `tab=details`; phone parameters without a tab open the details lookup.

- Either `phone` or `phoneDNIS` can supply the lookup number. Legacy
  `phoneNumber` and `telefon` aliases still work as alternatives to `phone`.
- When both candidates are nonempty, discard the ProveIt number `7447707829`.
  Formatting punctuation, the UK national prefix `0`, and country prefixes
  `44`/`0044` are recognized for this comparison.
- If both remaining numbers differ, `phone` takes priority over `phoneDNIS`.
- If both contain the ProveIt number, no phone lookup runs. A single supplied
  number retains the existing lookup behavior.
- The selected phone takes priority over email/name search filters.

This changes URL selection only; CRM authentication and backend matching remain
unchanged. Encode a literal `+` as `%2B` in URLs, or use country-code digits only.
