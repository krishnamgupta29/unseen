'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function DeepLinkRedirectContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if redirect has already been attempted in this session to prevent infinite loops
    if (sessionStorage.getItem('unseen_deeplink_redirected') === 'true') {
      return;
    }

    const ua = window.navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isAPK = /UnseenAndroidAPK/i.test(ua);

    if (isAndroid && !isAPK) {
      sessionStorage.setItem('unseen_deeplink_redirected', 'true');
      const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const fallbackUrl = window.location.href;
      const intentUrl = `intent://unseen-world.vercel.app${pathname}${search}#Intent;scheme=https;package=com.example.unseen;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
      
      window.location.href = intentUrl;
    }
  }, [pathname, searchParams]);

  return null;
}

export default function DeepLinkRedirect() {
  return (
    <Suspense fallback={null}>
      <DeepLinkRedirectContent />
    </Suspense>
  );
}
