/**
 * EmotionalChain Theme Toggle Component
 * Dark/Light theme switching with localStorage persistence
 */

import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('emotional-chain-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system theme
      setTheme('system');
      applyTheme('system');
    }
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemPrefersDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('emotional-chain-theme', newTheme);
    applyTheme(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-auto px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${className}`}
          aria-label="Toggle theme"
        >
          {getThemeIcon()}
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {getThemeLabel()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-36 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className={`flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="text-gray-700 dark:text-gray-300">Light</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className={`flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="text-gray-700 dark:text-gray-300">Dark</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleThemeChange('system')}
          className={`flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="text-gray-700 dark:text-gray-300">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Theme Provider Context (optional - for more complex theme management)
 */
export const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const savedTheme = localStorage.getItem('emotional-chain-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('emotional-chain-theme', newTheme);
    
    const root = document.documentElement;
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemPrefersDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeToggle;