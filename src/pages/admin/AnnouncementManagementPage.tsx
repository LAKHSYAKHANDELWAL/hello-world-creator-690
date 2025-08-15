import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnnouncementManagement } from '@/components/admin/AnnouncementManagement';

export default function AnnouncementManagementPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Announcement Management</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-6">
          <AnnouncementManagement />
        </div>
      </div>
    </div>
  );
}