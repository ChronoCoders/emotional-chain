export interface TerminalCommand {
  name: string;
  description: string;
  usage: string;
  examples: string[];
}

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    name: 'wallet',
    description: 'Manage wallet operations and display account information',
    usage: 'wallet [--status]',
    examples: ['wallet --status', 'wallet']
  },
  {
    name: 'mine',
    description: 'Start mining operations with biometric validation',
    usage: 'mine [--start | --biometric-validation]',
    examples: ['mine --start', 'mine --biometric-validation']
  },
  {
    name: 'network',
    description: 'Display network information and peer status',
    usage: 'network [--info | --peers]',
    examples: ['network --info', 'network --peers']
  },
  {
    name: 'status',
    description: 'Show overall system status',
    usage: 'status',
    examples: ['status']
  },
  {
    name: 'history',
    description: 'Display transaction history',
    usage: 'history',
    examples: ['history']
  },
  {
    name: 'help',
    description: 'Show available commands',
    usage: 'help [command]',
    examples: ['help', 'help wallet']
  },
  {
    name: 'clear',
    description: 'Clear terminal output',
    usage: 'clear',
    examples: ['clear']
  }
];

export function getCommandHelp(command?: string): string {
  if (!command) {
    return `🧠 EmotionalChain Terminal Commands:

${TERMINAL_COMMANDS.map(cmd => 
  `   ${cmd.name.padEnd(12)} - ${cmd.description}`
).join('\n')}

Type 'help <command>' for detailed usage information.`;
  }

  const cmd = TERMINAL_COMMANDS.find(c => c.name === command.toLowerCase());
  if (!cmd) {
    return `Unknown command: ${command}. Type 'help' for available commands.`;
  }

  return `🧠 ${cmd.name.toUpperCase()} Command Help:

Description: ${cmd.description}
Usage: ${cmd.usage}

Examples:
${cmd.examples.map(ex => `   $ ${ex}`).join('\n')}`;
}

export function parseCommand(input: string): { command: string; args: string[] } {
  const parts = input.trim().split(/\s+/);
  const command = parts[0] || '';
  const args = parts.slice(1);
  
  return { command, args };
}

export function formatTerminalOutput(text: string): string {
  return text.replace(/\n/g, '\n');
}
