import { Github, Globe, Twitter } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

export default function ExplorerFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8">
                <EmotionalChainLogo size={32} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">EmotionalChain</h3>
                <p className="text-sm text-slate-400">World's First Emotion-Powered Blockchain</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Explore the revolutionary blockchain that combines biometric validation with 
              Proof of Emotion consensus to create authentic human-centered value.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Network</h4>
            <ul className="space-y-2">
              <li><a href="/explorer/validators" className="text-slate-400 hover:text-green-400 text-sm transition-colors">Validators</a></li>
              <li><a href="/explorer/blocks" className="text-slate-400 hover:text-green-400 text-sm transition-colors">Blocks</a></li>
              <li><a href="/explorer/transactions" className="text-slate-400 hover:text-green-400 text-sm transition-colors">Transactions</a></li>
              <li><a href="/explorer/wellness" className="text-slate-400 hover:text-green-400 text-sm transition-colors">Wellness</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-green-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-green-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://emotionalchain.com" className="text-slate-400 hover:text-green-400 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © 2025 EmotionalChain. Revolutionizing blockchain with human emotion.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-slate-500 text-sm">Powered by Proof of Emotion</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500 text-sm font-medium">Network Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}