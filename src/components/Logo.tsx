import React from 'react';
import { GraduationCap } from 'lucide-react';
const Logo = () => {
  return <div className="flex items-center justify-center gap-2">
      <GraduationCap className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-foreground">edutech</span>
    </div>;
};
export default Logo;