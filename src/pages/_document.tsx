import { Html, Head, Main, NextScript } from 'next/document';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const attributionScript = readFileSync(path.join(process.cwd(), 'public/email-attribution.js'), 'utf8');
export default function Document() {
  return <Html><Head>
    <script dangerouslySetInnerHTML={{ __html: attributionScript }} />
  </Head><body><Main /><NextScript /></body></Html>;
}
