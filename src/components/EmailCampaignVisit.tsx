import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { clearEmailCampaignVisit, installEmailCampaignVisit } from '@/lib/emailCampaignVisit';

export default function EmailCampaignVisit() {
  const router = useRouter();
  useEffect(() => {
    const cleanup = installEmailCampaignVisit();
    const leaving = (url: string) => {
      if (!/^\/bani-uk-ai\/?$/.test(new URL(url, window.location.origin).pathname)) clearEmailCampaignVisit();
    };
    router.events.on('routeChangeStart', leaving);
    return () => { cleanup(); router.events.off('routeChangeStart', leaving); };
  }, [router]);
  return null;
}
