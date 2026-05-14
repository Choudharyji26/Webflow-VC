import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SetupConnect } from './components/SetupConnect';
import { SetupSite } from './components/SetupSite';
import { SetupCollection } from './components/SetupCollection';
import { SetupMapping } from './components/SetupMapping';
import { SetupTest } from './components/SetupTest';
import { Editor } from './components/Editor';

function App() {
  const location = useLocation();
  const isEditor = location.pathname === '/editor';

  return (
    <div className="max-w-[980px] mx-auto p-12">
      <div className="mb-10 pb-6 border-b-[1.5px] border-tx flex justify-between items-end">
        <div>
           <div className="font-mono text-[10px] text-tx3 uppercase tracking-[.14em] mb-3 flex items-center gap-3">
             Product Requirements Document <span className="bg-tx text-bg px-2 py-0.5 rounded text-[10px]">v2.0</span>
           </div>
           <div className="text-[30px] font-semibold tracking-[-.025em] leading-[1.15]">Webflow CMS Integration</div>
        </div>
        <div className="flex gap-4">
          <Link to="/" className={`text-[13px] font-medium ${!isEditor ? 'text-tx' : 'text-tx3 hover:text-tx'}`}>Settings</Link>
          <Link to="/editor" className={`text-[13px] font-medium ${isEditor ? 'text-tx' : 'text-tx3 hover:text-tx'}`}>Editor</Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<SetupConnect />} />
        <Route path="/setup/site" element={<SetupSite />} />
        <Route path="/setup/collection" element={<SetupCollection />} />
        <Route path="/setup/mapping" element={<SetupMapping />} />
        <Route path="/setup/test" element={<SetupTest />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </div>
  );
}

export default App;
