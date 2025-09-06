import { Link, Redirect } from 'wouter';
import { Shield, User, Settings, AlertTriangle } from 'lucide-react';
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

interface RoleBasedAccessProps {
  // In a real application, this would come from authentication context
  userRole?: 'user' | 'validator' | 'admin' | null;
}

export default function RoleBasedAccess({ userRole = null }: RoleBasedAccessProps) {
  // For demo purposes, we'll show a role selection screen
  // In production, this would be determined by authentication

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="terminal-window p-8 text-center">
          <div className="flex justify-center mb-6">
            <EmotionalChainLogo size={64} className="text-terminal-cyan" />
          </div>
          
          <h1 className="text-3xl font-bold text-terminal-green mb-4 terminal-text">
            &gt; Access EmotionalChain Network
          </h1>
          
          <p className="text-terminal-cyan mb-8 terminal-text">
            Select your access level to continue with the appropriate interface
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Access */}
            <Link href="/dashboard">
              <div className="bg-terminal-surface border-2 border-terminal-border p-6 hover:border-terminal-success transition-colors cursor-pointer group">
                <div className="flex justify-center mb-4">
                  <User className="w-12 h-12 text-terminal-cyan group-hover:text-terminal-success transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-terminal-green mb-3 terminal-text">User Dashboard</h3>
                <p className="text-terminal-green/70 text-sm mb-4 terminal-text">
                  View network statistics, explore the blockchain, and learn about EmotionalChain
                </p>
                <div className="space-y-2 text-xs text-terminal-cyan terminal-text">
                  <p>• Blockchain Explorer Access</p>
                  <p>• Network Statistics</p>
                  <p>• Documentation</p>
                  <p>• Getting Started Guide</p>
                </div>
                <button className="w-full mt-4 bg-terminal-cyan/20 border border-terminal-cyan text-terminal-cyan px-4 py-2 hover:bg-terminal-cyan/30 transition-colors terminal-text">
                  Enter as User
                </button>
              </div>
            </Link>

            {/* Validator Access */}
            <Link href="/validator">
              <div className="bg-terminal-surface border-2 border-terminal-border p-6 hover:border-terminal-gold transition-colors cursor-pointer group">
                <div className="flex justify-center mb-4">
                  <Shield className="w-12 h-12 text-terminal-gold group-hover:text-terminal-success transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-terminal-green mb-3 terminal-text">Validator Node</h3>
                <p className="text-terminal-green/70 text-sm mb-4 terminal-text">
                  Manage your validator node, monitor performance, and earn EMO rewards
                </p>
                <div className="space-y-2 text-xs text-terminal-gold terminal-text">
                  <p>• Node Management</p>
                  <p>• Biometric Device Setup</p>
                  <p>• Performance Metrics</p>
                  <p>• Reward Tracking</p>
                </div>
                <button className="w-full mt-4 bg-terminal-gold/20 border border-terminal-gold text-terminal-gold px-4 py-2 hover:bg-terminal-gold/30 transition-colors terminal-text">
                  Enter as Validator
                </button>
              </div>
            </Link>

            {/* Admin Access */}
            <Link href="/admin">
              <div className="bg-terminal-surface border-2 border-terminal-warning p-6 hover:border-terminal-orange transition-colors cursor-pointer group">
                <div className="flex justify-center mb-4">
                  <Settings className="w-12 h-12 text-terminal-orange group-hover:text-terminal-warning transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-terminal-green mb-3 terminal-text">Admin Panel</h3>
                <p className="text-terminal-green/70 text-sm mb-4 terminal-text">
                  Full system access for network administration and configuration
                </p>
                <div className="space-y-2 text-xs text-terminal-orange terminal-text">
                  <p>• System Configuration</p>
                  <p>• Network Management</p>
                  <p>• Validator Administration</p>
                  <p>• Emergency Controls</p>
                </div>
                <div className="flex items-center justify-center mt-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-terminal-warning mr-2" />
                  <span className="text-terminal-warning text-xs terminal-text">Requires Admin Credentials</span>
                </div>
                <button className="w-full bg-terminal-warning/20 border border-terminal-warning text-terminal-warning px-4 py-2 hover:bg-terminal-warning/30 transition-colors terminal-text">
                  Enter as Admin
                </button>
              </div>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-terminal-border">
            <p className="text-terminal-green/50 text-sm terminal-text">
              Need help? Check out our <Link href="/docs" className="text-terminal-cyan hover:text-terminal-success">documentation</Link> or 
              view the <Link href="/explorer" className="text-terminal-cyan hover:text-terminal-success">blockchain explorer</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}