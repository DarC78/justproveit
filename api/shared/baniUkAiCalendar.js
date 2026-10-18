const course = require('./bani-uk-ai-course.json');
const escapeIcs = value => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
// RFC 5545 folds at 75 UTF-8 octets, never inside a Romanian character.
function fold(line) {
  const lines = []; let current = '';
  for (const char of line) {
    if (Buffer.byteLength(current + char, 'utf8') > 75) {
      const trailing = current.match(/[ \t]+$/)?.[0] || '';
      lines.push(trailing ? current.slice(0, -trailing.length) : current);
      current = ' ' + trailing;
    }
    current += char;
  }
  lines.push(current); return lines.join('\r\n');
}
function calendar() {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ProveIt//Bani UK AI//RO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-TIMEZONE:Europe/London',
    'BEGIN:VTIMEZONE', 'TZID:Europe/London', 'BEGIN:STANDARD', 'DTSTART:19701025T020000', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0000', 'TZNAME:GMT', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
    'BEGIN:DAYLIGHT', 'DTSTART:19700329T010000', 'TZOFFSETFROM:+0000', 'TZOFFSETTO:+0100', 'TZNAME:BST', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT', 'END:VTIMEZONE'];
  course.sessions.forEach((session, index) => {
    const date = session.date.replaceAll('-', '');
    const minutes = Number(course.time.slice(0, 2)) * 60 + Number(course.time.slice(3)) + course.durationMinutes;
    const end = `${String(Math.floor(minutes / 60)).padStart(2, '0')}${String(minutes % 60).padStart(2, '0')}00`;
    lines.push('BEGIN:VEVENT', `UID:bani-uk-ai-${date}@justproveit.co.uk`, 'DTSTAMP:20261018T000000Z', `DTSTART;TZID=Europe/London:${date}T${course.time.replace(':', '')}00`, `DTEND;TZID=Europe/London:${date}T${end}`,
      `SUMMARY:${escapeIcs(`Bani în UK cu AI – Sesiunea ${index + 1}: ${session.title}`)}`, `DESCRIPTION:${escapeIcs(course.zoomNote + '\n' + session.detail)}`, `LOCATION:${escapeIcs(course.zoomUrl || 'Online – linkul Zoom va fi trimis înainte de sesiune')}`,
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Sesiunea începe într-o oră.', 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR'); return lines.map(fold).join('\r\n') + '\r\n';
}
module.exports = { calendar };
