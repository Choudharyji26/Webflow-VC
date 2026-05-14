import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WizardProgress } from './Wizard';

export function SetupCollection() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const siteId = searchParams.get('site_id');
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connectionId || !siteId) return;
    fetch(`/api/collections?connection_id=${connectionId}&site_id=${siteId}`)
      .then(r => r.json())
      .then(data => {
        setCollections(data.collections || []);
        setLoading(false);
      });
  }, [connectionId, siteId]);

  const selectCollection = async (coll) => {
    await fetch(`/api/connections/${connectionId}/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection_id: coll.id, collection_name: coll.displayName })
    });
    navigate(`/setup/mapping?connection_id=${connectionId}&collection_id=${coll.id}`);
  };

  if (loading) return <div>Loading collections...</div>;

  return (
    <div className="bg-surface border-[0.5px] border-bd rounded-xl overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] py-6 px-7">
      <WizardProgress currentStep={3} />

      <div className="text-[15px] font-semibold mb-1">Pick your blog collection</div>
      <div className="text-[13px] text-tx2 mb-5">Not sure? Pick the collection your blog posts live in — usually named 'Blog', 'Articles', or 'Posts'.</div>

      <div className="flex flex-col gap-3">
        {collections.map(coll => {
          const isLikelyBlog = ['blog', 'articles', 'posts'].some(kw => coll.slug.toLowerCase().includes(kw));
          return (
            <div
              key={coll.id}
              onClick={() => selectCollection(coll)}
              className="border-[0.5px] border-bd rounded-lg p-4 cursor-pointer hover:bg-s2 transition-colors flex justify-between items-center"
            >
              <div>
                <div className="text-[14px] font-medium flex items-center gap-2">
                  {coll.displayName}
                  {isLikelyBlog && <span className="bg-green-bg text-green text-[10px] px-2 py-0.5 rounded border border-green-bd">✦ Likely your blog</span>}
                </div>
                <div className="font-mono text-[11px] text-tx3 mt-1">/{coll.slug}</div>
              </div>
              <div className="text-[12px] text-tx2 text-right">
                 <div>Fields: {coll.fields?.length || 0}</div>
              </div>
            </div>
          );
        })}
      </div>
      {collections.length === 0 && (
         <div className="text-sm text-tx2 bg-s2 p-4 rounded-lg">This site has no CMS collections. You'll need to create a blog collection in Webflow first.</div>
      )}
    </div>
  );
}
