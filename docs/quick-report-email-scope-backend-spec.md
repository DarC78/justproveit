# Quick Report Email Scope Backend Spec

## Objective

Support separate report emails from the existing endpoint:

`POST /api/justproveit/quick-report/faza0`

No new API route is needed.

## Frontend Behavior

The Romanian CRM page `/ro/raport-gratuit` now has two report buttons:

- `Trimite raport faza zero`
- `Trimite raport faza 1`

Both buttons call the same endpoint. The Faza 1 button includes `emailScope`.
The Faza 0 button may omit `emailScope` for compatibility because the current
backend already sends Faza 0-only when `faza1Answers` is absent.

## Request Field

Add support for an optional string field:

```json
{
  "emailScope": "faza0"
}
```

Allowed values:

- `faza0`
- `faza1`
- `full`

If omitted, keep the current behavior.

## Scope Rules

### `emailScope: "faza0"`

The frontend sends only the existing Faza 0 `results`.

Backend should:

- save the lead/report as it does today
- email only the submitted Faza 0 rows
- not require `faza1Answers`

### `emailScope: "faza1"`

The frontend sends the existing Faza 0 `results` plus `faza1Answers`.

Backend should:

- save the lead/report as it does today
- calculate the Faza 1 rows from `faza1Answers`
- email only the Faza 1 rows
- exclude all Faza 0 rows from the email body
- still mark specialist follow-up for triggered `MF07`, `PE03`, and `AA02`

### `emailScope: "full"` or omitted

Backend should preserve the existing behavior:

- use submitted Faza 0 rows
- append calculated Faza 1 rows when `faza1Answers` is present
- email the full combined report

## Acceptance Criteria

- `Trimite raport faza zero` sends a Faza 0-only email.
- `Trimite raport faza 1` sends a Faza 1-only email.
- The Faza 1-only email does not include `MF01`, `CD01`, `CD07`, `FC02`, `FC05`, or `FC07`.
- Existing callers without `emailScope` continue to work unchanged.
- Response shape stays compatible with the existing success/error contract.
