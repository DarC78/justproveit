export function personalizedSubject(subject, recipientName = '') {
  if (/[\r\n\x00-\x1f\x7f]/.test(subject + recipientName)) {
    throw new Error('Email subjects and recipient names cannot contain control characters');
  }
  const name = recipientName.trim().replace(/\s+/g, ' ');
  const base = subject.trim();
  return name ? `${name}, ${base.charAt(0).toLocaleLowerCase('ro-RO')}${base.slice(1)}` : base;
}
