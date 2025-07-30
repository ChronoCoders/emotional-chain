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
    <header className="bg-slate-900/95 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Back Link */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Terminal</span>
              </div>
            </Link>
            
            <div className="w-px h-6 bg-slate-600"></div>
            
            <Link href="/explorer">
              <div className="flex items-center justify-center space-x-3">
                <EmotionalChainLogo size={32} className="text-green-400" />
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white">EmotionalChain</h1>
                  <p className="text-xs text-slate-400">Explorer</p>
                </div>
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
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
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
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Live</span>
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
                  <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
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