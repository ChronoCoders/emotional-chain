/**
 * Global Validator Distribution System
 * Maps 21 core validators across 7 continents and 21 strategic cities
 * Ensures optimal network performance, security, and decentralization
 */

export interface ValidatorLocation {
  validatorId: string;
  city: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface ValidatorWithLocation extends ValidatorLocation {
  status: 'online' | 'offline' | 'standby';
  votingPower: number;
  hasDevice: boolean;
}

// GLOBAL VALIDATOR DISTRIBUTION: 21 validators across 7 continents
const VALIDATOR_DISTRIBUTION: ValidatorLocation[] = [
  // NORTH AMERICA (5 validators)
  {
    validatorId: 'StellarNode',
    city: 'New York',
    continent: 'North America',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York'
  },
  {
    validatorId: 'NebulaForge',
    city: 'San Francisco',
    continent: 'North America',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles'
  },
  {
    validatorId: 'QuantumReach',
    city: 'Chicago',
    continent: 'North America',
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago'
  },
  {
    validatorId: 'OrionPulse',
    city: 'Austin',
    continent: 'North America',
    latitude: 30.2672,
    longitude: -97.7431,
    timezone: 'America/Chicago'
  },
  {
    validatorId: 'DarkMatterLabs',
    city: 'Los Angeles',
    continent: 'North America',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles'
  },

  // EUROPE (5 validators)
  {
    validatorId: 'GravityCore',
    city: 'Berlin',
    continent: 'Europe',
    latitude: 52.5200,
    longitude: 13.4050,
    timezone: 'Europe/Berlin'
  },
  {
    validatorId: 'AstroSentinel',
    city: 'London',
    continent: 'Europe',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London'
  },
  {
    validatorId: 'ByteGuardians',
    city: 'Paris',
    continent: 'Europe',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris'
  },
  {
    validatorId: 'ZeroLagOps',
    city: 'Amsterdam',
    continent: 'Europe',
    latitude: 52.3676,
    longitude: 4.9041,
    timezone: 'Europe/Amsterdam'
  },
  {
    validatorId: 'ChainFlux',
    city: 'Zurich',
    continent: 'Europe',
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: 'Europe/Zurich'
  },

  // ASIA (4 validators)
  {
    validatorId: 'BlockNerve',
    city: 'Singapore',
    continent: 'Asia',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore'
  },
  {
    validatorId: 'ValidatorX',
    city: 'Hong Kong',
    continent: 'Asia',
    latitude: 22.3193,
    longitude: 114.1694,
    timezone: 'Asia/Hong_Kong'
  },
  {
    validatorId: 'NovaSync',
    city: 'Seoul',
    continent: 'Asia',
    latitude: 37.5665,
    longitude: 126.9780,
    timezone: 'Asia/Seoul'
  },
  {
    validatorId: 'IronNode',
    city: 'Tokyo',
    continent: 'Asia',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo'
  },

  // SOUTH AMERICA (2 validators)
  {
    validatorId: 'SentinelTrust',
    city: 'São Paulo',
    continent: 'South America',
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: 'America/Sao_Paulo'
  },
  {
    validatorId: 'VaultProof',
    city: 'Buenos Aires',
    continent: 'South America',
    latitude: -34.6037,
    longitude: -58.3816,
    timezone: 'America/Argentina/Buenos_Aires'
  },

  // AFRICA (2 validators)
  {
    validatorId: 'SecureMesh',
    city: 'Lagos',
    continent: 'Africa',
    latitude: 6.5244,
    longitude: 3.3792,
    timezone: 'Africa/Lagos'
  },
  {
    validatorId: 'WatchtowerOne',
    city: 'Cape Town',
    continent: 'Africa',
    latitude: -33.9249,
    longitude: 18.4241,
    timezone: 'Africa/Johannesburg'
  },

  // OCEANIA (2 validators)
  {
    validatorId: 'AetherRunes',
    city: 'Sydney',
    continent: 'Oceania',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney'
  },
  {
    validatorId: 'ChronoKeep',
    city: 'Auckland',
    continent: 'Oceania',
    latitude: -37.0742,
    longitude: 174.8859,
    timezone: 'Pacific/Auckland'
  },

  // MIDDLE EAST (1 validator)
  {
    validatorId: 'SolForge',
    city: 'Dubai',
    continent: 'Middle East',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai'
  }
];

/**
 * Get validator location by validator ID
 */
export function getValidatorLocation(validatorId: string): ValidatorLocation | undefined {
  return VALIDATOR_DISTRIBUTION.find(v => v.validatorId === validatorId);
}

/**
 * Get all validator locations
 */
export function getAllValidatorLocations(): ValidatorLocation[] {
  return VALIDATOR_DISTRIBUTION;
}

/**
 * Get validators grouped by continent
 */
export function getValidatorsByContinent(): Record<string, ValidatorLocation[]> {
  const grouped: Record<string, ValidatorLocation[]> = {};
  
  VALIDATOR_DISTRIBUTION.forEach(validator => {
    if (!grouped[validator.continent]) {
      grouped[validator.continent] = [];
    }
    grouped[validator.continent].push(validator);
  });
  
  return grouped;
}

/**
 * Get validator distribution statistics
 */
export function getDistributionStats() {
  const continents = new Set(VALIDATOR_DISTRIBUTION.map(v => v.continent));
  const cities = new Set(VALIDATOR_DISTRIBUTION.map(v => v.city));
  
  return {
    totalValidators: VALIDATOR_DISTRIBUTION.length,
    continents: Array.from(continents).length,
    cities: Array.from(cities).length,
    distribution: getValidatorsByContinent()
  };
}

/**
 * Get distance between two validators (in kilometers using Haversine formula)
 */
export function getValidatorDistance(validatorId1: string, validatorId2: string): number | null {
  const v1 = getValidatorLocation(validatorId1);
  const v2 = getValidatorLocation(validatorId2);
  
  if (!v1 || !v2) return null;
  
  const R = 6371; // Earth radius in kilometers
  const dLat = (v2.latitude - v1.latitude) * Math.PI / 180;
  const dLon = (v2.longitude - v1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(v1.latitude * Math.PI / 180) * Math.cos(v2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Export validator distribution as JSON
 */
export function exportDistributionJSON(): ValidatorLocation[] {
  return VALIDATOR_DISTRIBUTION;
}
