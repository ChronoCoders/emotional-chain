#!/usr/bin/env node
/**
 * EmotionalChain CLI - Command Line Interface
 * Production-ready management tool for distributed EmotionalChain network
 */

const { spawn, exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

// Command definitions
const COMMANDS = {
  network: {
    description: 'Network management commands',
    subcommands: {
      deploy: 'Deploy a new network',
      start: 'Start existing network',
      stop: 'Stop network',
      status: 'Show network status'
    }
  },
  validator: {
    description: 'Validator node management',
    subcommands: {
      deploy: 'Deploy new validator',
      start: 'Start validator',
      stop: 'Stop validator',
      list: 'List validators'
    }
  },
  monitoring: {
    description: 'Network monitoring and alerts',
    subcommands: {
      dashboard: 'Open monitoring dashboard',
      alerts: 'Show active alerts',
      export: 'Export monitoring data'
    }
  },
  blockchain: {
    description: 'Blockchain operations',
    subcommands: {
      status: 'Blockchain status',
      consensus: 'Consensus information',
      economics: 'Token economics'
    }
  },
  config: {
    description: 'Configuration management',
    subcommands: {
      generate: 'Generate configuration files',
      validate: 'Validate configuration',
      export: 'Export environment file'
    }
  }
};

class EmotionalChainCLI {
  constructor() {
    this.projectDir = this.findProjectRoot();
    this.deploymentDir = path.join(this.projectDir, 'deployments');
  }

  findProjectRoot() {
    let currentDir = __dirname;
    while (currentDir !== '/') {
      try {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (require('fs').existsSync(packageJsonPath)) {
          return currentDir;
        }
      } catch (error) {
        // Continue searching
      }
      currentDir = path.dirname(currentDir);
    }
    return process.cwd();
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help') {
      this.showHelp();
      return;
    }

    const command = args[0];
    const subcommand = args[1];
    const commandArgs = args.slice(2);

    try {
      switch (command) {
        case 'network':
          await this.handleNetworkCommand(subcommand, commandArgs);
          break;
        case 'validator':
          await this.handleValidatorCommand(subcommand, commandArgs);
          break;
        case 'monitoring':
          await this.handleMonitoringCommand(subcommand, commandArgs);
          break;
        case 'blockchain':
          await this.handleBlockchainCommand(subcommand, commandArgs);
          break;
        case 'config':
          await this.handleConfigCommand(subcommand, commandArgs);
          break;
        case 'version':
          this.showVersion();
          break;
        default:
          console.error(`❌ Unknown command: ${command}`);
          console.log('Run "emotionalchain-cli help" for usage information.');
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
      process.exit(1);
    }
  }

  async handleNetworkCommand(subcommand, args) {
    switch (subcommand) {
      case 'deploy':
        await this.deployNetwork(args);
        break;
      case 'start':
        await this.startNetwork(args);
        break;
      case 'stop':
        await this.stopNetwork(args);
        break;
      case 'status':
        await this.networkStatus(args);
        break;
      default:
        console.log('Network commands:');
        console.log('  deploy [validators=5] [target=local] - Deploy new network');
        console.log('  start                                - Start existing network');
        console.log('  stop                                 - Stop network');
        console.log('  status                               - Show network status');
    }
  }

  async deployNetwork(args) {
    const validators = args[0] || '5';
    const target = args[1] || 'local';
    
    console.log('🌐 Deploying EmotionalChain network...');
    console.log(`   Validators: ${validators}`);
    console.log(`   Target: ${target}`);

    const env = {
      ...process.env,
      NUM_VALIDATORS: validators,
      DEPLOYMENT_TARGET: target,
      NETWORK_ID: process.env.NETWORK_ID || 'emotionalchain-mainnet'
    };

    const deployScript = path.join(this.projectDir, 'deployment/startup-scripts/deploy-network.sh');
    
    await this.executeCommand('bash', [deployScript], { env });
    
    console.log('✅ Network deployment completed!');
    console.log(`📁 Deployment files: ${this.deploymentDir}`);
  }

  async startNetwork(args) {
    console.log('🚀 Starting EmotionalChain network...');
    
    const manageScript = path.join(this.deploymentDir, 'manage-network.sh');
    
    if (await this.fileExists(manageScript)) {
      await this.executeCommand('bash', [manageScript, 'start']);
    } else {
      console.error('❌ Network not deployed yet. Run: emotionalchain-cli network deploy');
      process.exit(1);
    }
  }

  async stopNetwork(args) {
    console.log('🛑 Stopping EmotionalChain network...');
    
    const manageScript = path.join(this.deploymentDir, 'manage-network.sh');
    
    if (await this.fileExists(manageScript)) {
      await this.executeCommand('bash', [manageScript, 'stop']);
    } else {
      console.log('⚠️ Network management script not found');
    }
  }

  async networkStatus(args) {
    console.log('📊 EmotionalChain Network Status');
    console.log('================================');
    
    const manageScript = path.join(this.deploymentDir, 'manage-network.sh');
    
    if (await this.fileExists(manageScript)) {
      await this.executeCommand('bash', [manageScript, 'status']);
    } else {
      console.log('❌ Network not deployed');
    }

    // Also check API status if available
    try {
      const response = await this.makeAPIRequest('/api/network-status');
      if (response) {
        console.log('\n🌐 API Network Status:');
        console.log(`   Running: ${response.isRunning ? '✅' : '❌'}`);
        console.log(`   Validators: ${response.stats?.activeValidators || 0}`);
        console.log(`   Block Height: ${response.stats?.blockHeight || 0}`);
        console.log(`   Consensus: ${response.stats?.consensusPercentage || '0'}%`);
        
        if (response.distributed?.enabled) {
          console.log('\n🌐 Distributed Network:');
          console.log(`   Operational: ${response.distributed.networkOperational ? '✅' : '❌'}`);
          console.log(`   Validators: ${response.distributed.validatorCount}`);
          console.log(`   Health: ${response.distributed.consensusHealth}%`);
          console.log(`   Security: ${response.distributed.economicSecurity}`);
        }
      }
    } catch (error) {
      console.log('\n⚠️ API not available (this is normal if network is not running)');
    }
  }

  async handleValidatorCommand(subcommand, args) {
    switch (subcommand) {
      case 'deploy':
        await this.deployValidator(args);
        break;
      case 'list':
        await this.listValidators(args);
        break;
      case 'start':
        await this.startValidator(args);
        break;
      case 'stop':
        await this.stopValidator(args);
        break;
      default:
        console.log('Validator commands:');
        console.log('  deploy <id> [stake=10000] - Deploy new validator');
        console.log('  list                      - List all validators');
        console.log('  start <id>                - Start validator');
        console.log('  stop <id>                 - Stop validator');
    }
  }

  async deployValidator(args) {
    const validatorId = args[0];
    const stake = args[1] || '10000';
    
    if (!validatorId) {
      console.error('❌ Validator ID required');
      console.log('Usage: emotionalchain-cli validator deploy <id> [stake]');
      process.exit(1);
    }

    console.log(`🏗️ Deploying validator: ${validatorId}`);
    console.log(`   Stake: ${stake} EMO`);

    try {
      const response = await this.makeAPIRequest('/api/command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'deploy',
          args: ['validator', validatorId, stake]
        })
      });

      if (response && response.includes('✅')) {
        console.log('✅ Validator deployed successfully');
      } else {
        console.log('❌ Validator deployment failed');
        if (response) console.log(response);
      }
    } catch (error) {
      console.error('❌ Failed to deploy validator:', error.message);
      console.log('Make sure the EmotionalChain API is running');
    }
  }

  async listValidators(args) {
    console.log('📋 EmotionalChain Validators');
    console.log('===========================');

    try {
      const response = await this.makeAPIRequest('/api/command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'deploy',
          args: ['list']
        })
      });

      if (response) {
        console.log(response);
      } else {
        console.log('❌ No response from API');
      }
    } catch (error) {
      console.log('⚠️ API not available, checking local deployments...');
      
      // Check local deployment directory
      try {
        const items = await fs.readdir(this.deploymentDir);
        const validatorDirs = items.filter(item => item.startsWith('validator-'));
        
        if (validatorDirs.length === 0) {
          console.log('📋 No validators found');
        } else {
          console.log(`Found ${validatorDirs.length} validator configurations:`);
          validatorDirs.forEach((dir, index) => {
            console.log(`${index + 1}. ${dir}`);
          });
        }
      } catch (error) {
        console.log('❌ No deployment directory found');
      }
    }
  }

  async startValidator(args) {
    const validatorId = args[0];
    
    if (!validatorId) {
      console.error('❌ Validator ID required');
      process.exit(1);
    }

    console.log(`🚀 Starting validator: ${validatorId}`);
    
    const validatorDir = path.join(this.deploymentDir, validatorId);
    const startScript = path.join(validatorDir, 'start.sh');
    
    if (await this.fileExists(startScript)) {
      await this.executeCommand('bash', [startScript], { 
        cwd: validatorDir,
        detached: true 
      });
      console.log(`✅ Validator ${validatorId} started`);
    } else {
      console.error(`❌ Validator ${validatorId} not found or not configured`);
    }
  }

  async stopValidator(args) {
    const validatorId = args[0];
    
    if (!validatorId) {
      console.error('❌ Validator ID required');
      process.exit(1);
    }

    console.log(`🛑 Stopping validator: ${validatorId}`);
    
    try {
      const response = await this.makeAPIRequest('/api/command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'deploy',
          args: ['stop', validatorId]
        })
      });

      if (response && response.includes('✅')) {
        console.log(`✅ Validator ${validatorId} stopped`);
      } else {
        console.log(`⚠️ Stop command sent, response: ${response || 'none'}`);
      }
    } catch (error) {
      console.error(`❌ Failed to stop validator: ${error.message}`);
    }
  }

  async handleMonitoringCommand(subcommand, args) {
    switch (subcommand) {
      case 'dashboard':
        console.log('🖥️ Opening monitoring dashboard...');
        console.log('Dashboard available at: http://localhost:5000');
        break;
      case 'alerts':
        await this.showAlerts(args);
        break;
      case 'export':
        await this.exportMonitoring(args);
        break;
      default:
        console.log('Monitoring commands:');
        console.log('  dashboard  - Open web dashboard');
        console.log('  alerts     - Show active alerts');
        console.log('  export     - Export monitoring data');
    }
  }

  async showAlerts(args) {
    try {
      const response = await this.makeAPIRequest('/api/command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'monitor',
          args: ['alerts']
        })
      });

      if (response) {
        console.log(response);
      } else {
        console.log('❌ No monitoring data available');
      }
    } catch (error) {
      console.error('❌ Failed to fetch alerts:', error.message);
    }
  }

  async exportMonitoring(args) {
    const format = args[0] || 'json';
    
    try {
      const response = await this.makeAPIRequest('/api/command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'monitor',
          args: ['export', format]
        })
      });

      if (response) {
        const filename = `emotionalchain-monitoring-${Date.now()}.${format}`;
        await fs.writeFile(filename, response);
        console.log(`✅ Monitoring data exported to: ${filename}`);
      }
    } catch (error) {
      console.error('❌ Failed to export monitoring data:', error.message);
    }
  }

  async handleBlockchainCommand(subcommand, args) {
    switch (subcommand) {
      case 'status':
        await this.blockchainStatus(args);
        break;
      case 'consensus':
        await this.consensusInfo(args);
        break;
      case 'economics':
        await this.tokenEconomics(args);
        break;
      default:
        console.log('Blockchain commands:');
        console.log('  status     - Show blockchain status');
        console.log('  consensus  - Show consensus information');
        console.log('  economics  - Show token economics');
    }
  }

  async blockchainStatus(args) {
    try {
      const response = await this.makeAPIRequest('/api/network-status');
      
      if (response) {
        console.log('⛓️ Blockchain Status');
        console.log('===================');
        console.log(`Block Height: ${response.stats?.blockHeight || 0}`);
        console.log(`Total Supply: ${response.stats?.totalSupply || 0} EMO`);
        console.log(`Circulating: ${response.stats?.circulatingSupply || 0} EMO`);
        console.log(`Active Validators: ${response.stats?.activeValidators || 0}`);
        console.log(`Consensus Rate: ${response.stats?.consensusPercentage || 0}%`);
        console.log(`TPS: ${response.stats?.tps || 0}`);
        
        if (response.latestBlock) {
          console.log(`\nLatest Block:`);
          console.log(`  Hash: ${response.latestBlock.hash?.substring(0, 16)}...`);
          console.log(`  Validator: ${response.latestBlock.validator}`);
          console.log(`  Transactions: ${response.latestBlock.transactions?.length || 0}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to get blockchain status:', error.message);
    }
  }

  async consensusInfo(args) {
    try {
      const response = await this.makeAPIRequest('/api/command', {
        method: 'POST',
        body: JSON.stringify({
          command: 'distributed',
          args: ['status']
        })
      });

      if (response) {
        console.log(response);
      } else {
        console.log('❌ Distributed consensus not available');
      }
    } catch (error) {
      console.error('❌ Failed to get consensus info:', error.message);
    }
  }

  async tokenEconomics(args) {
    try {
      const response = await this.makeAPIRequest('/api/token-economics');
      
      if (response) {
        console.log('💰 Token Economics');
        console.log('==================');
        console.log(`Total Supply: ${response.totalSupply?.toFixed(2) || 0} EMO`);
        console.log(`Circulating: ${response.circulatingSupply?.toFixed(2) || 0} EMO`);
        console.log(`Market Cap: $${response.marketCap?.toFixed(2) || 0}`);
        console.log(`Price: $${response.currentPrice?.toFixed(4) || 0}`);
        console.log(`APR: ${response.stakingAPR?.toFixed(2) || 0}%`);
      }
    } catch (error) {
      console.error('❌ Failed to get token economics:', error.message);
    }
  }

  async handleConfigCommand(subcommand, args) {
    switch (subcommand) {
      case 'generate':
        await this.generateConfig(args);
        break;
      case 'validate':
        await this.validateConfig(args);
        break;
      case 'export':
        await this.exportConfig(args);
        break;
      default:
        console.log('Config commands:');
        console.log('  generate  - Generate configuration files');
        console.log('  validate  - Validate existing configuration');
        console.log('  export    - Export environment variables');
    }
  }

  async generateConfig(args) {
    console.log('⚙️ Generating EmotionalChain configuration...');
    
    const configDir = path.join(this.projectDir, 'config');
    await fs.mkdir(configDir, { recursive: true });
    
    const envExample = `# EmotionalChain Configuration
# Copy to .env and customize

# Network Configuration
NETWORK_ID=emotionalchain-mainnet
NODE_ENV=production
ENABLE_DISTRIBUTED=true

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/emotionalchain

# Network Bootstrap Nodes
BOOTSTRAP_NODES=/ip4/127.0.0.1/tcp/4001,/dns4/bootstrap.emotionalchain.io/tcp/4001

# Consensus Parameters
MIN_VALIDATORS=4
TARGET_VALIDATORS=21
MINIMUM_STAKE=1000
BLOCK_REWARD=10

# API Configuration
PORT=5000
CORS_ORIGINS=*

# Biometric Configuration
BIOMETRIC_ENABLED=true
MIN_EMOTIONAL_SCORE=70
MIN_AUTHENTICITY=0.7

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
`;

    const configFile = path.join(configDir, '.env.example');
    await fs.writeFile(configFile, envExample);
    
    console.log(`✅ Configuration template generated: ${configFile}`);
    console.log('Copy to .env and customize for your deployment');
  }

  async validateConfig(args) {
    console.log('✅ Configuration validation would be implemented here');
    // Implementation would use ProductionConfig validation
  }

  async exportConfig(args) {
    console.log('📄 Configuration export would be implemented here');
    // Implementation would use ProductionConfig export
  }

  showHelp() {
    console.log(`
🌐 EmotionalChain CLI - Distributed Blockchain Management

Usage: emotionalchain-cli <command> <subcommand> [options]

Commands:
`);

    Object.entries(COMMANDS).forEach(([command, info]) => {
      console.log(`  ${command.padEnd(12)} ${info.description}`);
      Object.entries(info.subcommands).forEach(([sub, desc]) => {
        console.log(`    ${sub.padEnd(10)} ${desc}`);
      });
      console.log('');
    });

    console.log(`Examples:
  emotionalchain-cli network deploy 5 local
  emotionalchain-cli validator deploy node-001 15000
  emotionalchain-cli monitoring alerts
  emotionalchain-cli blockchain status

For detailed help on any command:
  emotionalchain-cli <command>
`);
  }

  showVersion() {
    const packageJson = require(path.join(this.projectDir, 'package.json'));
    console.log(`EmotionalChain CLI v${packageJson.version || '1.0.0'}`);
    console.log('Distributed Proof-of-Emotion Blockchain');
  }

  // Utility methods
  async executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  async makeAPIRequest(endpoint, options = {}) {
    const url = `http://localhost:${process.env.PORT || 5000}${endpoint}`;
    
    try {
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new EmotionalChainCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = EmotionalChainCLI;