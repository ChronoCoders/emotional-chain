import { Link, useLocation } from "wouter";
import { Activity, Users, Zap, BarChart3, ArrowLeft, HeartHandshake } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

export default function ExplorerHeader() {
  const [location] = useLocation();

  const navigation = [
    { name: "Overview", href: "/explorer", icon: Activity },
    { name: "Validators", href: "/explorer/validators", icon: Users },
    { name: "Blocks", href: "/explorer/blocks", icon: Zap },
    { name: "Transactions", href: "/explorer/transactions", icon: BarChart3 },
    { name: "Wellness", href: "/explorer/wellness", icon: HeartHandshake },
  ];

  return (
    <header className="bg-terminal-surface border-b-2 border-terminal-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Back Link */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 text-terminal-green hover:text-terminal-cyan transition-colors terminal-text">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">[&lt; Back to Terminal]</span>
              </div>
            </Link>
            
            <div className="w-px h-6 bg-terminal-border"></div>
            
            <Link href="/explorer">
              <div className="text-center">
                <h1 className="text-xl font-bold text-terminal-green terminal-text">&gt; EmotionalChain</h1>
                <p className="text-xs text-terminal-green/70 terminal-text">Explorer</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href !== "/explorer" && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-2 px-3 py-2 transition-colors terminal-text ${
                    isActive 
                      ? "text-terminal-success border border-terminal-border bg-terminal-surface" 
                      : "text-terminal-green hover:text-terminal-cyan"
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Network Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="status-online status-indicator"></div>
              <span className="text-sm text-terminal-success terminal-text">[LIVE]</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <nav className="flex items-center space-x-4 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href !== "/explorer" && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-1 px-3 py-2 whitespace-nowrap transition-colors terminal-text ${
                    isActive 
                      ? "text-terminal-success border border-terminal-border bg-terminal-surface" 
                      : "text-terminal-green hover:text-terminal-cyan"
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}