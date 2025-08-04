/**
 * Mobile-Responsive Terminal Layout for EmotionalChain
 * Optimized display for all device sizes with collapsible sections
 */

import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Users,
  Coins,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/button';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  collapsible: boolean;
  defaultCollapsed?: boolean;
}

interface MobileResponsiveTerminalProps {
  sections: Section[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function MobileResponsiveTerminal({ 
  sections, 
  header, 
  footer 
}: MobileResponsiveTerminalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Detect device type and orientation
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setOrientation(height > width ? 'portrait' : 'landscape');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Initialize collapsed sections based on device type
  useEffect(() => {
    const initialCollapsed = new Set<string>();
    
    sections.forEach(section => {
      if (section.defaultCollapsed || (isMobile && section.collapsible)) {
        initialCollapsed.add(section.id);
      }
    });
    
    setCollapsedSections(initialCollapsed);
  }, [isMobile, sections]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="w-4 h-4" />;
    if (isTablet) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getLayoutClasses = () => {
    if (isMobile) {
      return 'flex flex-col min-h-screen bg-gray-50';
    }
    
    if (isTablet) {
      return 'flex flex-col lg:flex-row min-h-screen bg-gray-50';
    }
    
    return 'flex min-h-screen bg-gray-50';
  };

  const getSectionClasses = (index: number) => {
    if (isMobile) {
      return 'mb-4';
    }
    
    if (isTablet && orientation === 'portrait') {
      return index % 2 === 0 ? 'lg:pr-2 mb-4' : 'lg:pl-2 mb-4';
    }
    
    return 'mb-6';
  };

  return (
    <div className={getLayoutClasses()}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            {getDeviceIcon()}
            <span className="text-sm font-medium text-gray-900">
              EmotionalChain
            </span>
          </div>
          
          <div className="flex items-center space-x-2">

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Header */}
      {!isMobile && header && (
        <div className="bg-white  border-b border-gray-200  px-6 py-4">
          {header}
        </div>
      )}

      {/* Mobile Sidebar/Navigation */}
      {isMobile && sidebarOpen && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  toggleSection(section.id);
                  setSidebarOpen(false);
                }}
                className="flex items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center space-y-1">
                  {section.icon}
                  <span className="text-xs font-medium text-gray-700">
                    {section.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className={`p-4 ${isMobile ? '' : 'p-6'} space-y-6`}>
          {/* Section Grid */}
          <div className={`
            ${isMobile 
              ? 'space-y-4' 
              : isTablet 
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
                : 'grid grid-cols-1 xl:grid-cols-2 gap-6'
            }
          `}>
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`
                  bg-white 
                  border border-gray-200 
                  rounded-lg overflow-hidden shadow-sm
                  ${getSectionClasses(index)}
                  ${isMobile && collapsedSections.has(section.id) ? 'h-auto' : ''}
                `}
              >
                {/* Section Header */}
                <div
                  className={`
                    px-4 py-3 bg-gray-50 
                    border-b border-gray-200 
                    flex items-center justify-between
                    ${section.collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                  onClick={() => section.collapsible && toggleSection(section.id)}
                >
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <h3 className="text-sm font-medium text-gray-900">
                      {section.title}
                    </h3>
                  </div>
                  
                  {section.collapsible && (
                    <div className="flex items-center">
                      {collapsedSections.has(section.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  )}
                </div>

                {/* Section Content */}
                {!collapsedSections.has(section.id) && (
                  <div className={`
                    p-4 
                    ${isMobile ? 'text-sm' : ''}
                    overflow-x-auto
                  `}>
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {footer && (
        <div className="bg-white  border-t border-gray-200  px-4 py-3">
          {footer}
        </div>
      )}

      {/* Device Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-2 py-1 rounded opacity-50">
          {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'} • {orientation}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for responsive utilities
 */
export function useResponsive() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation: height > width ? 'portrait' : 'landscape',
        width,
        height
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(pointer: coarse)',
  mouse: '(pointer: fine)'
};

export default MobileResponsiveTerminal;