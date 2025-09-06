import { Github, Globe, Twitter } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

export default function ExplorerFooter() {
  return (
    <footer className="bg-terminal-surface border-t-2 border-terminal-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8">
                <EmotionalChainLogo size={32} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-terminal-green terminal-text">EmotionalChain</h3>
                <p className="text-sm text-terminal-cyan terminal-text">World's First Emotion-Powered Blockchain</p>
              </div>
            </div>
            <p className="text-terminal-green/70 text-sm leading-relaxed max-w-md terminal-text">
              Explore the revolutionary blockchain that combines biometric validation with 
              Proof of Emotion consensus to create authentic human-centered value.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-terminal-green font-semibold mb-4 terminal-text">Network</h4>
            <ul className="space-y-2">
              <li><a href="/explorer/validators" className="text-terminal-cyan hover:text-terminal-success text-sm transition-colors terminal-text">Validators</a></li>
              <li><a href="/explorer/blocks" className="text-terminal-cyan hover:text-terminal-success text-sm transition-colors terminal-text">Blocks</a></li>
              <li><a href="/explorer/transactions" className="text-terminal-cyan hover:text-terminal-success text-sm transition-colors terminal-text">Transactions</a></li>
              <li><a href="/explorer/wellness" className="text-terminal-cyan hover:text-terminal-success text-sm transition-colors terminal-text">Wellness</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-terminal-green font-semibold mb-4 terminal-text">Community</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-terminal-cyan hover:text-terminal-success transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-terminal-cyan hover:text-terminal-success transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://emotionalchain.com" className="text-terminal-cyan hover:text-terminal-success transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-terminal-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-terminal-green/50 text-sm terminal-text">
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