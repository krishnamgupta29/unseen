'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MessageThreadRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/messages?id=${id}`);
    }
  }, [id, router]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#080016]">
      <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
    </div>
  );
}
