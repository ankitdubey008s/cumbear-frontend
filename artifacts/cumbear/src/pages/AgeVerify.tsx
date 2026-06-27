export default function AgeVerify() {
  return (
    <div className="min-h-screen bg-cumbear-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/cumbear.png" 
            alt="Cumbear" 
            className="w-20 h-20 mx-auto rounded-2xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold text-white mt-4 tracking-tight">Cumbear</h1>
        </div>

        {/* Age Verification Box */}
        <div className="bg-cumbear-card border border-cumbear-border rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Age Verification Required</h2>
          
          <div className="bg-cumbear-dark border border-cumbear-border rounded-xl p-4 mb-6">
            <p className="text-cumbear-text-muted text-sm leading-relaxed">
              This website contains adult content and is strictly for individuals 
              <span className="text-white font-bold"> 18 years of age or older</span>.
            </p>
            <p className="text-cumbear-text-dim text-xs mt-3">
              By entering, you confirm that you are of legal age to view adult content 
              in your jurisdiction and agree to our Terms of Service.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                localStorage.setItem('cumbear_age_verified', 'true');
                window.location.href = '/';
              }}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              I am 18 or older — Enter
            </button>
            
            <button
              onClick={() => {
                window.location.href = 'https://www.google.com';
              }}
              className="w-full py-3.5 rounded-xl bg-cumbear-card border border-cumbear-border text-cumbear-text-muted font-medium text-sm hover:border-cumbear-border-hover hover:text-white transition-colors"
            >
              I am under 18 — Exit
            </button>
          </div>
        </div>

        <p className="text-cumbear-text-dim text-xs">
          © 2026 Cumbear.in — All rights reserved
        </p>
      </div>
    </div>
  );
}

