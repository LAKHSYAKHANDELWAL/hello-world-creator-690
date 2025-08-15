import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  description: string;
  post_date: string;
  created_at: string;
  target_class?: string;
  target_section?: string;
}

interface NotificationBellProps {
  userType: 'student' | 'teacher';
  userClass?: string;
  userSection?: string;
}

const NotificationBell = ({ userType, userClass, userSection }: NotificationBellProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, [userClass, userSection]);

  const fetchAnnouncements = async () => {
    try {
      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Filter by class/section for students
      if (userType === 'student' && userClass) {
        query = query.or(`target_class.is.null,target_class.eq.${userClass}`);
        if (userSection) {
          query = query.or(`target_section.is.null,target_section.eq.${userSection}`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setAnnouncements(data || []);
      
      // Calculate unread count (announcements from last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const unread = (data || []).filter(
        (announcement) => new Date(announcement.created_at) > yesterday
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Announcements</h3>
        </div>
        <ScrollArea className="h-80">
          {announcements.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No announcements yet
            </div>
          ) : (
            <div className="space-y-1">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium text-sm mb-1">
                    {announcement.title}
                  </div>
                  {announcement.description && (
                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {announcement.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;