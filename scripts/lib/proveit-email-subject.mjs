export function personalizedSubject(subject, recipientName = '', { preserveCase = false } = {}) {
  if (/[\r\n\x00-\x1f\x7f]/.test(subject + recipientName)) {
    throw new Error('Email subjects and recipient names cannot contain control characters');
  }
  const name = recipientName.trim().replace(/\s+/g, ' ');
  const base = subject.trim();
  return name ? `${name}, ${(preserveCase ? base.charAt(0) : base.charAt(0).toLocaleLowerCase('ro-RO'))}${base.slice(1)}` : base;
}
