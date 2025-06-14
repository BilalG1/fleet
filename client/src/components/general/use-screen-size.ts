import { useState, useEffect } from 'react';

interface ScreenSize {
  screenWidth: number;
  isMobile: boolean;
}

export function useScreenSize(): ScreenSize {
  const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = screenWidth < 768;

  return { screenWidth, isMobile };
} 