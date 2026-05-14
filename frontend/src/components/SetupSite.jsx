import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WizardProgress } from './Wizard';

export function SetupSite() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connectionId) return;
    fetch(`/api/sites?connection_id=${connectionId}`)
      .then(r => r.json())
      .then(data => {
        setSites(data.sites || []);
        setLoading(false);
      });
  }, [connectionId]);

  const selectSite = async (site) => {
    await fetch(`/api/connections/${connectionId}/site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: site.id, site_name: site.displayName })
    });
    navigate(`/setup/collection?connection_id=${connectionId}&site_id=${site.id}`);
  };

  if (loading) return <div>Loading sites...</div>;

  return (
    <div className="bg-surface border-[0.5px] border-bd rounded-xl overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] py-6 px-7">
      <WizardProgress currentStep={2} />

      <div className="text-[15px] font-semibold mb-1">Pick your site</div>
      <div className="text-[13px] text-tx2 mb-5">Select the Webflow site you want to publish content to.</div>

      <div className="grid grid-cols-2 gap-3.5">
        {sites.map(site => (
          <div
            key={site.id}
            onClick={() => selectSite(site)}
            className="border-[0.5px] border-bd rounded-lg p-4 cursor-pointer hover:bg-s2 transition-colors"
          >
            <div className="text-[14px] font-medium mb-1">{site.displayName}</div>
            <div className="font-mono text-[11px] text-tx3 mb-3">{site.shortName}.webflow.io</div>
            <div className="text-[11px] text-tx2">Last published: {new Date(site.lastPublished).toLocaleDateString() || 'Never'}</div>
          </div>
        ))}
      </div>
      {sites.length === 0 && (
         <div className="text-sm text-tx2 bg-s2 p-4 rounded-lg">No sites found. Please create a site in Webflow.</div>
      )}
    </div>
  );
}
