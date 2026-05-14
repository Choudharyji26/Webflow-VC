import React, { useState, useEffect } from 'react';

export function Editor() {
  const [connection, setConnection] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  const [article, setArticle] = useState({
    title: 'The Future of Frontend Development',
    body: `<h2>Introduction</h2>
<p>Frontend development is evolving rapidly. Here are some thoughts on where it's going.</p>
<p><strong>React</strong> continues to dominate the landscape, but new frameworks like Vue and Svelte are gaining traction.</p>
<ul>
  <li>Server-side rendering is back</li>
  <li>Build tools are getting faster</li>
</ul>
<blockquote>"The web is a constantly moving target."</blockquote>
<!-- The following code block should trigger a warning and be stripped -->
<pre><code>console.log("Hello Webflow!");</code></pre>`,
    summary: 'A brief overview of modern frontend development trends.'
  });

  useEffect(() => {
    // In a real app we'd fetch the current user's connection status
    fetch('/api/connections/test-user-123')
      .then(r => r.json())
      .then(data => setConnection(data.connection));
  }, []);

  const handleExportClick = () => {
    // Check for unsupported tags
    const unsupportedPatterns = [/<img[^>]*>/, /<table.*?>/, /<code.*?>/, /<pre.*?>/];
    const hasUnsupported = unsupportedPatterns.some(p => p.test(article.body));

    if (hasUnsupported) {
      setShowWarning(true);
    } else {
      executeExport();
    }
  };

  const executeExport = async () => {
    setShowWarning(false);
    setIsExporting(true);
    setExportResult(null);

    try {
      const res = await fetch(`/api/connections/${connection.id}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: 'article-789',
          title: article.title,
          slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          body: article.body,
          summary: article.summary
        })
      });

      const data = await res.json();
      if (res.ok) {
        setExportResult({ success: true, item: data.item });
      } else {
        setExportResult({ success: false, error: data.detail || 'Failed to export' });
      }
    } catch (e) {
      setExportResult({ success: false, error: e.message });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <input
          type="text"
          value={article.title}
          onChange={e => setArticle({...article, title: e.target.value})}
          className="w-full text-[24px] font-semibold mb-4 outline-none bg-transparent"
        />
        <textarea
          value={article.body}
          onChange={e => setArticle({...article, body: e.target.value})}
          className="w-full h-[400px] text-[14px] text-tx2 font-mono p-4 border-[0.5px] border-bd rounded-lg bg-surface resize-y focus:outline-none focus:border-tx"
        />
      </div>

      <div className="w-[300px] flex-shrink-0">
        <div className="bg-surface border-[0.5px] border-bd rounded-lg p-5">
          <div className="text-[13px] font-semibold mb-4 border-b-[0.5px] border-bd pb-2">Publishing</div>

          {connection && connection.status === 'active' ? (
             <div>
               <div className="flex items-center gap-2 text-[12px] text-green mb-4">
                 <div className="w-2 h-2 rounded-full bg-green"></div>
                 Connected to {connection.site_display_name}
               </div>

               <button
                 onClick={handleExportClick}
                 disabled={isExporting}
                 className="w-full bg-wf text-white py-2 rounded-lg text-[13px] font-medium disabled:opacity-50"
               >
                 {isExporting ? 'Exporting...' : 'Export to CMS → Webflow'}
               </button>

               {exportResult && exportResult.success && (
                 <div className="mt-4 p-3 bg-green-bg border border-green-bd rounded-lg text-[12px]">
                   <div className="font-semibold text-green mb-1">Draft created ✓</div>
                   <a
                     href={`https://webflow.com/design/${connection.webflow_site_id}?itemId=${exportResult.item.id}`}
                     target="_blank"
                     rel="noreferrer"
                     className="text-tx2 underline"
                   >
                     Open in Webflow
                   </a>
                 </div>
               )}

               {exportResult && !exportResult.success && (
                 <div className="mt-4 p-3 bg-red-bg border border-red-bd rounded-lg text-[12px] text-red">
                   Export failed: {exportResult.error}
                 </div>
               )}
             </div>
          ) : (
            <div>
              <div className="text-[12px] text-tx2 mb-4">Webflow is not connected.</div>
              <button
                 onClick={() => window.location.href = '/'}
                 className="w-full border-[0.5px] border-bd bg-s2 py-2 rounded-lg text-[13px] font-medium"
               >
                 Setup Integration
               </button>
            </div>
          )}
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-xl border-[0.5px] border-bd max-w-[400px] shadow-lg">
            <div className="text-[16px] font-semibold mb-2">Unsupported formatting detected</div>
            <div className="text-[13px] text-tx2 mb-4 leading-relaxed">
              Your article contains code blocks, tables, or inline images. These elements aren't supported by Webflow and will be stripped during export.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-2 rounded-lg border-[0.5px] border-bd text-[13px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeExport}
                className="flex-1 py-2 rounded-lg bg-tx text-bg text-[13px] font-medium"
              >
                Continue anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
