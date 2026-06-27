import { AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-cumbear-dark border-t border-cumbear-border mt-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <div className="bg-cumbear-card border border-cumbear-border rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cumbear-red shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Parents</h3>
              <p className="text-xs text-cumbear-text-muted leading-relaxed">
                Cumbear.in uses the "Restricted To Adults" (RTA) website label to better enable parental filtering.
                Protect your children from adult content and block access to this site by using parental controls.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Support</h4>
            <ul className="space-y-1.5">
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">FAQ</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Help Us Improve</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Contact Us</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Advertisers</h4>
            <ul className="space-y-1.5">
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Buy Traffic</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Get Listed</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Legal</h4>
            <ul className="space-y-1.5">
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Terms of Service</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Privacy Statement</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">DMCA / Copyright</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">2257</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Content</h4>
            <ul className="space-y-1.5">
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Acceptable Content Policy</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Notice and Action</span></li>
              <li><span className="text-xs text-cumbear-text-muted hover:text-white cursor-pointer transition-colors">Digital Services Act</span></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="bg-cumbear-text-dim/20 px-3 py-1.5 rounded text-cumbear-text-muted text-xs font-bold tracking-wider">
            RTA
          </div>
          <div className="text-cumbear-text-dim text-xs font-bold tracking-wider">
            ASACP<br/><span className="text-[10px] font-normal">APPROVED MEMBER</span>
          </div>
        </div>

        <div className="text-center text-cumbear-text-dim text-xs pt-4 border-t border-cumbear-border">
          &copy; 2026 Cumbear.in - All rights reserved. Cumbear is a video aggregator platform.
        </div>
      </div>
    </footer>
  );
}

