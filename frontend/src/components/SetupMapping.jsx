import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WizardProgress } from './Wizard';
import { clsx } from 'clsx';

export function SetupMapping() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const collectionId = searchParams.get('collection_id');
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [mapping, setMapping] = useState({ body: '', summary: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!connectionId || !collectionId) return;
    fetch(`/api/collections/${collectionId}?connection_id=${connectionId}`)
      .then(r => r.json())
      .then(data => {
        const wfFields = data.fields || [];
        setFields(wfFields);

        // Auto-suggest logic
        const newMapping = { body: '', summary: '' };

        const richTextFields = wfFields.filter(f => f.type === 'RichText');
        const plainTextFields = wfFields.filter(f => f.type === 'PlainText');

        const bodyMatches = richTextFields.filter(f => ['body', 'content', 'post-body', 'article', 'text'].some(kw => f.slug.toLowerCase().includes(kw)));
        if (bodyMatches.length > 0) newMapping.body = bodyMatches[0].slug;
        else if (richTextFields.length > 0) newMapping.body = richTextFields[0].slug;

        const summaryMatches = plainTextFields.filter(f => ['summary', 'excerpt', 'description', 'intro'].some(kw => f.slug.toLowerCase().includes(kw)));
        if (summaryMatches.length > 0) newMapping.summary = summaryMatches[0].slug;

        setMapping(newMapping);
        setLoading(false);
      });
  }, [connectionId, collectionId]);

  const handleSave = async () => {
    if (!mapping.body) {
      setError("Article body mapping is required.");
      return;
    }

    await fetch(`/api/connections/${connectionId}/mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping)
    });
    navigate(`/setup/test?connection_id=${connectionId}`);
  };

  if (loading) return <div>Loading schema...</div>;

  const richTextFields = fields.filter(f => f.type === 'RichText');
  const plainTextFields = fields.filter(f => f.type === 'PlainText');

  const isBodyMapped = !!mapping.body;
  const isSummaryMapped = !!mapping.summary;

  return (
    <div className="bg-surface border-[0.5px] border-bd rounded-xl overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] py-6 px-7">
      <WizardProgress currentStep={4} />

      <div className="text-[15px] font-semibold mb-1">Map your content fields</div>
      <div className="text-[13px] text-tx2 mb-5">We've automatically matched most fields. Review and adjust where needed.</div>

      {error && <div className="mb-4 text-red bg-red-bg p-3 text-sm rounded border border-red-bd">{error}</div>}

      <div className="border-[0.5px] border-bd rounded-[10px] overflow-hidden mb-4">
        {/* Header */}
        <div className="grid grid-cols-[1fr_40px_1fr_80px] gap-0 px-4 py-2 bg-s2 border-b-[0.5px] border-bd">
          <div className="font-mono text-[10px] text-tx3 uppercase tracking-[.07em]">Our field</div>
          <div></div>
          <div className="font-mono text-[10px] text-tx3 uppercase tracking-[.07em]">Webflow field</div>
          <div className="font-mono text-[10px] text-tx3 uppercase tracking-[.07em] text-right">Status</div>
        </div>

        {/* Title row */}
        <div className="grid grid-cols-[1fr_40px_1fr_80px] gap-0 px-4 py-3 border-b-[0.5px] border-bd items-center">
          <div><div className="text-[13px] font-medium">Article title</div><div className="text-[11px] text-tx3">Required</div></div>
          <div className="text-center text-tx3">→</div>
          <div className="font-mono text-[12px] text-tx2 bg-s2 rounded px-2 py-1 inline-block w-max">name <span className="text-tx3">(system)</span></div>
          <div className="text-right"><span className="bg-green-bg text-green text-[11px] px-2 py-0.5 rounded border-none">✓ Auto</span></div>
        </div>

        {/* Body row */}
        <div className={clsx("grid grid-cols-[1fr_40px_1fr_80px] gap-0 px-4 py-3 border-b-[0.5px] border-bd items-center", isBodyMapped ? "bg-green-bg" : "bg-red-bg")}>
          <div><div className="text-[13px] font-medium">Article body</div><div className={clsx("text-[11px]", isBodyMapped ? "text-green" : "text-red")}>Required · RichText</div></div>
          <div className={clsx("text-center", isBodyMapped ? "text-green" : "text-red")}>→</div>
          <div>
            <select
              value={mapping.body}
              onChange={e => setMapping({...mapping, body: e.target.value})}
              className={clsx("w-full text-[12px] border-[0.5px] rounded p-1.5 bg-white font-mono", isBodyMapped ? "border-green-bd" : "border-red-bd")}
            >
              <option value="">── Select a RichText field ──</option>
              {richTextFields.map(f => <option key={f.slug} value={f.slug}>{f.slug} (RichText)</option>)}
            </select>
          </div>
          <div className="text-right">
            {isBodyMapped ?
              <span className="bg-green-bg text-green text-[11px] px-2 py-0.5 rounded border border-green-bd">✓ Mapped</span> :
              <span className="bg-red-bg text-red text-[11px] px-2 py-0.5 rounded border border-red-bd">✗ Missing</span>
            }
          </div>
        </div>

        {/* Summary row */}
        <div className={clsx("grid grid-cols-[1fr_40px_1fr_80px] gap-0 px-4 py-3 items-center", !isSummaryMapped && "bg-amber-bg")}>
          <div><div className="text-[13px] font-medium">Summary / excerpt</div><div className={clsx("text-[11px]", !isSummaryMapped ? "text-amber" : "text-tx3")}>Optional</div></div>
          <div className="text-center text-tx3">→</div>
          <div>
            <select
              value={mapping.summary}
              onChange={e => setMapping({...mapping, summary: e.target.value})}
              className={clsx("w-full text-[12px] border-[0.5px] rounded p-1.5 bg-white font-mono", !isSummaryMapped ? "border-amber-bd" : "border-bd")}
            >
              <option value="">── Skip this field ──</option>
              {plainTextFields.map(f => <option key={f.slug} value={f.slug}>{f.slug} (PlainText)</option>)}
            </select>
          </div>
          <div className="text-right">
            {isSummaryMapped ?
              <span className="bg-green-bg text-green text-[11px] px-2 py-0.5 rounded border-none">✓ Mapped</span> :
              <span className="bg-amber-bg text-amber text-[11px] px-2 py-0.5 rounded border border-amber-bd">⚠ Skipped</span>
            }
          </div>
        </div>
      </div>

      <div className="bg-s2 rounded-lg py-3 px-4 text-[12px] text-tx2 mb-4.5">
        <strong className="text-tx">Images are not included in this release.</strong> Thumbnail and hero image fields will remain empty in Webflow — set them manually after export.
      </div>

      <div className="flex gap-2.5 items-center">
        <button
          onClick={handleSave}
          className="bg-tx text-bg rounded-lg py-2.5 px-5 text-[13px] font-medium cursor-pointer"
        >
          Continue → Test connection
        </button>
        {isBodyMapped && <div className="text-[12px] text-tx3">Required fields are mapped ✓</div>}
      </div>
    </div>
  );
}
