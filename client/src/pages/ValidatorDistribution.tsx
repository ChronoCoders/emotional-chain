import { useQuery } from "@tanstack/react-query";
import { Globe, MapPin, Users, Zap, Eye } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';
import { useState } from "react";

interface Validator {
  validatorId: string;
  city: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  status: 'online' | 'offline' | 'standby';
  hasDevice: boolean;
  votingPower: number;
  balance: number;
  emotionalScore: number;
}

interface DistributionData {
  validators: Validator[];
  stats: {
    totalValidators: number;
    continents: number;
    cities: number;
    distribution: Record<string, any[]>;
  };
  byContinent: Record<string, any[]>;
}

const CONTINENT_COLORS: Record<string, string> = {
  'North America': 'bg-terminal-cyan/20 border-terminal-cyan',
  'Europe': 'bg-terminal-orange/20 border-terminal-orange',
  'Asia': 'bg-terminal-success/20 border-terminal-success',
  'South America': 'bg-terminal-gold/20 border-terminal-gold',
  'Africa': 'bg-terminal-pink/20 border-terminal-pink',
  'Oceania': 'bg-terminal-blue/20 border-terminal-blue',
  'Middle East': 'bg-terminal-red/20 border-terminal-red'
};

const CONTINENT_TEXT_COLORS: Record<string, string> = {
  'North America': 'text-terminal-cyan',
  'Europe': 'text-terminal-orange',
  'Asia': 'text-terminal-success',
  'South America': 'text-terminal-gold',
  'Africa': 'text-terminal-pink',
  'Oceania': 'text-terminal-blue',
  'Middle East': 'text-terminal-red'
};

export default function ValidatorDistribution() {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [expandedValidator, setExpandedValidator] = useState<string | null>(null);

  const { data: distributionData, isLoading } = useQuery<DistributionData>({
    queryKey: ['/api/validators/distribution/global'],
    refetchInterval: 20000,
    staleTime: 15000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-terminal-success';
      case 'offline': return 'text-terminal-orange';
      case 'standby': return 'text-terminal-warn';
      default: return 'text-terminal-green';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return '[ONLINE]';
      case 'offline': return '[OFFLINE]';
      case 'standby': return '[STANDBY]';
      default: return '[UNKNOWN]';
    }
  };

  const filteredValidators = selectedContinent
    ? distributionData?.validators.filter(v => v.continent === selectedContinent)
    : distributionData?.validators || [];

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono">
      {/* Header */}
      <header className="terminal-window p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <EmotionalChainLogo size={32} className="text-terminal-cyan" />
            <div>
              <h1 className="text-2xl font-bold text-terminal-green terminal-text">&gt; Global Validator Distribution</h1>
              <p className="text-terminal-cyan terminal-text">21 Validators Across 7 Continents</p>
            </div>
          </div>
          <Globe className="w-8 h-8 text-terminal-cyan animate-spin" />
        </div>
      </header>

      <div className="container mx-auto px-4 space-y-8">
        {/* Statistics Grid */}
        {distributionData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="terminal-window p-6 border border-terminal-cyan">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-terminal-cyan text-sm font-medium terminal-text">TOTAL VALIDATORS</h3>
                <Users className="w-5 h-5 text-terminal-success" />
              </div>
              <p className="text-3xl font-bold text-terminal-green terminal-text">{distributionData.stats.totalValidators}</p>
            </div>

            <div className="terminal-window p-6 border border-terminal-orange">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-terminal-orange text-sm font-medium terminal-text">CONTINENTS</h3>
                <Globe className="w-5 h-5 text-terminal-success" />
              </div>
              <p className="text-3xl font-bold text-terminal-green terminal-text">{distributionData.stats.continents}</p>
            </div>

            <div className="terminal-window p-6 border border-terminal-gold">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-terminal-gold text-sm font-medium terminal-text">CITIES</h3>
                <MapPin className="w-5 h-5 text-terminal-success" />
              </div>
              <p className="text-3xl font-bold text-terminal-green terminal-text">{distributionData.stats.cities}</p>
            </div>

            <div className="terminal-window p-6 border border-terminal-success">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-terminal-success text-sm font-medium terminal-text">ONLINE NODES</h3>
                <Zap className="w-5 h-5 text-terminal-success" />
              </div>
              <p className="text-3xl font-bold text-terminal-green terminal-text">
                {distributionData.validators.filter(v => v.status === 'online').length}
              </p>
            </div>
          </div>
        )}

        {/* Continental Tabs */}
        {distributionData && (
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 terminal-text">[FILTER] By Continent</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedContinent(null)}
                className={`p-3 border transition-all terminal-text ${
                  selectedContinent === null
                    ? 'bg-terminal-success/20 border-terminal-success text-terminal-success'
                    : 'border-terminal-border hover:border-terminal-green'
                }`}
              >
                All Regions
              </button>
              {Object.keys(CONTINENT_COLORS).map(continent => (
                <button
                  key={continent}
                  onClick={() => setSelectedContinent(continent)}
                  className={`p-3 border transition-all terminal-text ${
                    selectedContinent === continent
                      ? `${CONTINENT_COLORS[continent]} font-bold`
                      : 'border-terminal-border hover:border-terminal-green'
                  }`}
                >
                  {continent}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Validators Grid */}
        {isLoading ? (
          <div className="terminal-window p-12 text-center">
            <p className="text-terminal-cyan terminal-text">Loading validator distribution...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredValidators.map(validator => (
              <div
                key={validator.validatorId}
                className={`terminal-window p-5 border transition-all cursor-pointer hover:border-terminal-success ${
                  expandedValidator === validator.validatorId
                    ? 'border-terminal-success bg-terminal-success/5'
                    : `border-terminal-border ${CONTINENT_COLORS[validator.continent]}`
                }`}
                onClick={() => setExpandedValidator(
                  expandedValidator === validator.validatorId ? null : validator.validatorId
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-terminal-green terminal-text text-sm mb-1">
                      {validator.validatorId}
                    </h3>
                    <p className={`text-xs font-semibold mb-2 ${getStatusColor(validator.status)} terminal-text`}>
                      {getStatusLabel(validator.status)}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-terminal-cyan" />
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-xs text-terminal-cyan terminal-text">
                    <span className="font-semibold">{validator.city}</span>
                    <br />
                    <span className={`${CONTINENT_TEXT_COLORS[validator.continent]}`}>
                      {validator.continent}
                    </span>
                  </div>
                  <div className="text-xs text-terminal-green/70 terminal-text">
                    Timezone: {validator.timezone}
                  </div>
                </div>

                <div className="bg-terminal-surface border border-terminal-border p-3 mb-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-terminal-gold terminal-text font-semibold">Voting Power</p>
                      <p className="text-terminal-cyan text-lg font-bold terminal-text">{validator.votingPower}</p>
                    </div>
                    <div>
                      <p className="text-terminal-orange terminal-text font-semibold">Device</p>
                      <p className={`text-lg font-bold terminal-text ${validator.hasDevice ? 'text-terminal-success' : 'text-terminal-warn'}`}>
                        {validator.hasDevice ? '[ACTIVE]' : '[OFFLINE]'}
                      </p>
                    </div>
                  </div>
                </div>

                {expandedValidator === validator.validatorId && (
                  <div className="border-t border-terminal-border pt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-terminal-green/70 terminal-text">
                      <span>Coordinates:</span>
                      <span className="text-terminal-cyan">{validator.latitude.toFixed(2)}°, {validator.longitude.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between text-terminal-green/70 terminal-text">
                      <span>Balance:</span>
                      <span className="text-terminal-gold">{Math.round(validator.balance).toLocaleString()} EMO</span>
                    </div>
                    <div className="flex justify-between text-terminal-green/70 terminal-text">
                      <span>Emotional Score:</span>
                      <span className="text-terminal-orange">{Math.round(validator.emotionalScore)}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Continent Summary */}
        {distributionData && !selectedContinent && (
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 terminal-text">[SUMMARY] Distribution by Region</h2>
            <div className="space-y-3">
              {Object.entries(distributionData.stats.distribution).map(([continent, validators]: any) => (
                <div key={continent} className={`border p-4 ${CONTINENT_COLORS[continent]}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${CONTINENT_TEXT_COLORS[continent]} terminal-text`}>
                        {continent}
                      </p>
                      <p className="text-xs text-terminal-green/70 terminal-text">
                        {validators.map((v: any) => v.validatorId).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${CONTINENT_TEXT_COLORS[continent]} terminal-text`}>
                        {validators.length}
                      </p>
                      <p className="text-xs text-terminal-green/70 terminal-text">validators</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
