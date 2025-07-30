import { Link, useLocation } from "wouter";
import { Activity, Users, Zap, Heart, BarChart3 } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navigation = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Validators", href: "/validators", icon: Users },
    { name: "Blocks", href: "/blocks", icon: Zap },
    { name: "Transactions", href: "/transactions", icon: BarChart3 },
    { name: "Wellness", href: "/wellness", icon: Heart },
  ];

  return (
    <header className="bg-slate-900/95 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emotional-400 to-emotional-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white heartbeat" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EmotionalChain</h1>
                <p className="text-xs text-slate-400">Explorer</p>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-emotional-500/20 text-emotional-400 border border-emotional-500/30" 
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
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-green"></div>
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
                (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive 
                      ? "bg-emotional-500/20 text-emotional-400 border border-emotional-500/30" 
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