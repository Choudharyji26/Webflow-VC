import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WizardProgress } from './Wizard';
import { Check, X } from 'lucide-react';

export function SetupTest() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const navigate = useNavigate();

  const [status, setStatus] = useState('testing'); // testing, success, error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!connectionId) return;

    // Simulate test push by pushing a dummy draft
    const runTest = async () => {
      try {
        const res = await fetch(`/api/connections/${connectionId}/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: 'test-article-123',
            title: 'Test Webflow Integration',
            slug: `test-integration-${Date.now()}`,
            body: '<p>This is a test draft to verify the Webflow connection.</p>',
            summary: 'Test summary'
          })
        });

        const data = await res.json();
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg(data.detail || 'Unknown error occurred');
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    };

    runTest();
  }, [connectionId]);

  return (
    <div className="bg-surface border-[0.5px] border-bd rounded-xl overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] py-6 px-7">
      <WizardProgress currentStep={5} />

      {status === 'testing' && (
        <div className="text-center py-8">
          <div className="text-[15px] font-semibold mb-2">Testing connection...</div>
          <div className="text-[13px] text-tx2">Creating a test draft in Webflow.</div>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-green-bg text-green rounded-full flex items-center justify-center mx-auto mb-4 border border-green-bd">
            <Check size={24} />
          </div>
          <div className="text-[18px] font-semibold mb-2">You're all set!</div>
          <div className="text-[13px] text-tx2 mb-6">The Webflow integration is active. You can now export articles directly to your CMS.</div>
          <button
            onClick={() => navigate('/editor')}
            className="bg-tx text-bg rounded-lg py-2.5 px-6 text-[13px] font-medium cursor-pointer"
          >
            Go to Editor
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-red-bg text-red rounded-full flex items-center justify-center mx-auto mb-4 border border-red-bd">
             <X size={24} />
          </div>
          <div className="text-[15px] font-semibold mb-2">Test push failed</div>
          <div className="text-[13px] text-red mb-6 bg-red-bg p-3 rounded-lg border border-red-bd max-w-[400px] mx-auto overflow-hidden text-ellipsis">
            {errorMsg}
          </div>
          <button
            onClick={() => navigate(`/setup/mapping?connection_id=${connectionId}`)}
            className="border-[0.5px] border-bd bg-s2 text-tx rounded-lg py-2.5 px-6 text-[13px] font-medium cursor-pointer"
          >
            ← Back to mapping
          </button>
        </div>
      )}
    </div>
  );
}
