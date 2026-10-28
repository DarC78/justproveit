import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

const source = await fs.readFile(new URL("../src/lib/bookedCalls.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { bookedCallsForDate, bookedCallTime, loadBookedCalls, bookingActionNotice } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("reschedule success distinguishes skipped email from queued WhatsApp text", () => {
  const notice=bookingActionNotice({action:"reschedule",emailQueued:false,whatsAppQueued:true});
  assert.match(notice,/Programare reprogramata/);assert.match(notice,/Email omis/);assert.match(notice,/WhatsApp text: in coada/);
  const both=bookingActionNotice({action:"reschedule",emailQueued:true,whatsAppQueued:true});
  assert.match(both,/Email: in coada/);assert.doesNotMatch(both,/Email omis/);
  assert.match(bookingActionNotice({action:"reschedule",emailQueued:false,whatsAppQueued:false}),/WhatsApp omis/);
  assert.match(bookingActionNotice({action:"cancel"}),/au fost anulate/);
});

test("UK date boundaries, daylight saving, cancelled calls and chronological ordering", () => {
  const rows = [
    { interestId: "late", contactTimeUtc: "2026-07-02T15:00:00Z" },
    { interestId: "midnight", contactTimeUtc: "2026-07-01T23:30:00Z" },
    { interestId: "next-day", contactTimeUtc: "2026-07-02T23:00:00Z" },
    { interestId: "cancelled", contactTimeUtc: "2026-07-02T10:00:00Z", intentStatus: "Cancelled" },
    { interestId: "invalid", contactTimeUtc: null },
  ];
  assert.deepEqual(bookedCallsForDate(rows, "2026-07-02").map(row => row.interestId), ["midnight", "late"]);
  assert.equal(bookedCallTime.format(new Date(rows[0].contactTimeUtc)), "16:00");
  assert.equal(bookedCallTime.format(new Date("2026-10-29T12:00:00Z")), "12:00");
  assert.equal(bookedCallsForDate([{ contactTimeUtc: "2026-10-25T00:30:00Z" }, { contactTimeUtc: "2026-10-25T01:30:00Z" }], "2026-10-25").length, 2);
});

test("reads every booking page and service scope, including reserved calls", async () => {
  const calls = [];
  const result = await loadBookedCalls(async params => {
    calls.push(params);
    assert.equal(params.closed, "all");
    assert.equal(params.includeReserved, true);
    const rows = params.service ? [{ interestId: "scoped" }]
      : params.intent === "CALENDLY" ? [{ interestId: "calendly" }]
      : params.offset === 0 ? [{ interestId: "first" }] : [{ interestId: "second" }];
    return { rows, total: !params.service && params.intent === "MANUAL_BOOK" ? 2 : 1,
      options: { services: [{ serviceKey: "BookCall" }] } };
  }, () => false);
  assert.deepEqual(result.map(row => row.interestId).sort(), ["calendly", "first", "scoped", "second"]);
  assert.ok(calls.some(call => call.offset === 1 && call.intent === "MANUAL_BOOK"));
  assert.ok(calls.some(call => call.service === "BookCall"));
});

test("incomplete pagination fails visibly instead of showing a partial schedule", async () => {
  await assert.rejects(loadBookedCalls(async () => ({ rows: [], total: 1 }), () => false), /incompleta/);
});

test("cancelled loads do not continue fetching pages", async () => {
  let cancelled = false;
  let requests = 0;
  await loadBookedCalls(async () => { requests++; cancelled = true; return { rows: [{ interestId: "one" }], total: 100 }; }, () => cancelled);
  assert.equal(requests, 1);
});
