import React from 'react';

export function SetupConnect() {
  const handleConnect = async () => {
    try {
      const res = await fetch('/auth/webflow/connect?user_id=test-user-123');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-surface border-[0.5px] border-bd rounded-xl overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,.06)]">
      <div className="bg-s3 border-b-[0.5px] border-bd py-2.5 px-4 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#f4807a]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#f6c24a]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#6cc86a]"></div>
        <div className="font-mono text-[11px] text-tx3 ml-2">ourplatform.com/settings/integrations/webflow</div>
      </div>

      <div className="py-6 px-7">
        <div className="max-w-[480px] mx-auto text-center py-3">
          <div className="w-[52px] h-[52px] bg-wf-bg rounded-xl mx-auto mb-4 flex items-center justify-center text-[26px] border-[0.5px] border-[#9ab8f8]">
            𝑊
          </div>
          <div className="text-[18px] font-semibold mb-2">Connect your Webflow site</div>
          <div className="text-[13px] text-tx2 leading-[1.6] mb-6">
            Your blog and thought leadership content will be sent directly to your Webflow CMS as drafts — ready for you to review and publish.
          </div>

          <div className="bg-s2 rounded-lg py-3.5 px-4.5 mb-5.5 text-left">
            <div className="text-[11px] font-semibold text-tx3 uppercase tracking-[.06em] mb-2">What we'll be able to do</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2 text-[13px]"><span className="text-green">✓</span> Create draft items in your blog collection</div>
              <div className="flex gap-2 text-[13px]"><span className="text-green">✓</span> Read your collection structure to map fields</div>
              <div className="flex gap-2 text-[13px] text-tx2"><span>—</span> We will never publish, delete, or modify your live site</div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            className="bg-wf text-white rounded-lg py-3 px-6 text-[14px] font-medium cursor-pointer mb-2.5 hover:bg-opacity-90 transition-opacity"
          >
            Connect Webflow ↗
          </button>
          <div className="text-[12px] text-tx3">You'll be taken to Webflow to authorize. Takes less than 30 seconds.</div>
        </div>
      </div>
    </div>
  );
}
