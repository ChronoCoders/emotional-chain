import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { parseCommand, formatTerminalOutput, getCommandHelp } from '@/lib/terminal-commands';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalInterfaceProps {
  className?: string;
}

export default function TerminalInterface({ className = "" }: TerminalInterfaceProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: '🧠 EmotionalChain Terminal - Ready\n\nType "help" for available commands.',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { isConnected, lastMessage, sendCommand } = useWebSocket();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'command_result') {
        addLine('output', formatTerminalOutput(lastMessage.result || ''));
      } else if (lastMessage.type === 'connection') {
        addLine('output', `✅ ${lastMessage.message}`);
      } else if (lastMessage.type === 'error') {
        addLine('error', `❌ ${lastMessage.message}`);
      }
    }
  }, [lastMessage]);

  const addLine = (type: 'input' | 'output' | 'error', content: string) => {
    const newLine: TerminalLine = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = (commandInput: string) => {
    const trimmedInput = commandInput.trim();
    if (!trimmedInput) return;

    // Add command to history
    setCommandHistory(prev => [...prev.filter(cmd => cmd !== trimmedInput), trimmedInput]);
    setHistoryIndex(-1);

    // Add input line to terminal
    addLine('input', `user@emotionalchain:~$ ${trimmedInput}`);

    const { command, args } = parseCommand(trimmedInput);

    // Handle local commands
    if (command.toLowerCase() === 'clear') {
      setLines([]);
      return;
    }

    if (command.toLowerCase() === 'help') {
      const helpText = getCommandHelp(args[0]);
      addLine('output', helpText);
      return;
    }

    // Handle status command - show connection and network info
    if (command.toLowerCase() === 'status') {
      if (isConnected) {
        addLine('output', '✅ Connected to EmotionalChain network\n📡 Real-time data streaming active\n🔗 WebSocket connection established');
        // Send command to get detailed status
        sendCommand('status', args);
      } else {
        addLine('error', '❌ Not connected to EmotionalChain network\n🔄 Attempting to reconnect...\n💡 The blockchain is running - connection will restore automatically');
      }
      return;
    }

    // Send command via WebSocket if connected
    if (isConnected) {
      sendCommand(command, args);
    } else {
      addLine('error', '❌ Not connected to EmotionalChain network. Attempting to reconnect...\n💡 Type "status" to check connection state');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleQuickCommand = (command: string) => {
    setCurrentInput(command);
    executeCommand(command);
    setCurrentInput('');
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-terminal-cyan';
      case 'error': return 'text-terminal-error';
      default: return 'text-terminal-green';
    }
  };

  return (
    <div className={`terminal-window rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-terminal-cyan text-lg font-bold">
          ┌─────── EMOTIONAL_CHAIN_TERMINAL ───────┐
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`}></div>
          <span className={`text-sm ${isConnected ? 'text-terminal-success' : 'text-terminal-error'}`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      
      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="bg-terminal-bg rounded p-4 h-96 overflow-y-auto scrollbar-terminal terminal-text text-sm mb-4"
      >
        {lines.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap`}>
            {line.content}
          </div>
        ))}
        {/* Cursor */}
        <div className="text-terminal-green">
          <span className="text-terminal-cyan">user@emotionalchain</span>:
          <span className="text-terminal-orange">~</span>$ 
          <span className="cursor"></span>
        </div>
      </div>
      
      {/* Command Input */}
      <div className="flex items-center bg-terminal-surface rounded p-3 border border-terminal-border mb-4">
        <span className="text-terminal-cyan mr-2">user@emotionalchain:~$</span>
        <input 
          ref={inputRef}
          type="text" 
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent flex-1 text-terminal-green outline-none terminal-text" 
          placeholder="Enter command..."
          autoFocus
        />
      </div>
      
      {/* Quick Commands */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button 
          onClick={() => handleQuickCommand('wallet --status')}
          className="bg-terminal-surface hover:bg-terminal-border text-terminal-green px-3 py-1 rounded text-sm border border-terminal-border transition-colors"
        >
          wallet --status
        </button>
        <button 
          onClick={() => handleQuickCommand('mine --start')}
          className="bg-terminal-surface hover:bg-terminal-border text-terminal-green px-3 py-1 rounded text-sm border border-terminal-border transition-colors"
        >
          mine --start
        </button>
        <button 
          onClick={() => handleQuickCommand('history')}
          className="bg-terminal-surface hover:bg-terminal-border text-terminal-green px-3 py-1 rounded text-sm border border-terminal-border transition-colors"
        >
          history
        </button>
        <button 
          onClick={() => handleQuickCommand('network --info')}
          className="bg-terminal-surface hover:bg-terminal-border text-terminal-green px-3 py-1 rounded text-sm border border-terminal-border transition-colors"
        >
          network --info
        </button>
      </div>
    </div>
  );
}
