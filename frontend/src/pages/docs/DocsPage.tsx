import { useEffect, useState } from 'react';
import { fetchDocs } from '@/services/docsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Loader } from '@/components/ui/loader';

export default function DocsPage() {
  const [doc, setDoc] = useState<{ markdown: string } | null>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchDocs();
      if (data.isPublic) setDoc({ markdown: data.markdown });
    })();
  }, []);

  if (!doc) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MarkdownRenderer markdown={doc.markdown} />
    </div>
  );
}
