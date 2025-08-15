import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Calendar, Users, Upload, File, MessageSquare, Plus, Send, Filter, Search, Target } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  target_type?: 'single' | 'multiple' | 'class_section' | 'whole_school';
  target_ids?: string[];
  target_class?: string;
  target_section?: string;
  post_date: string;
  is_read?: boolean;
  sent_by?: string;
  created_at: string;
};

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [students, setStudents] = useState<Option[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTargetType, setFilterTargetType] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    target_type: 'whole_school' as 'single' | 'multiple' | 'class_section' | 'whole_school',
    target_ids: [] as string[],
    target_class: '',
    target_section: '',
    post_date: new Date().toISOString().split('T')[0],
    send_push_notification: false
  });
  const { toast } = useToast();

  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    fetchAnnouncements();
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = announcements;
    
    if (searchTerm) {
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          announcement.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterTargetType !== 'all') {
      filtered = filtered.filter(
        (announcement) => announcement.target_type === filterTargetType
      );
    }
    
    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, filterTargetType]);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } else {
      setAnnouncements(data || []);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, class, section')
      .order('name');
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      const studentOptions: Option[] = data?.map(student => ({
        label: `${student.name} (${student.id}) - Class ${student.class}${student.section ? `-${student.section}` : ''}`,
        value: student.id
      })) || [];
      setStudents(studentOptions);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let fileUrl = formData.image_url;
    
    // Upload file if selected
    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile);
      if (uploadedUrl) {
        fileUrl = uploadedUrl;
      } else {
        return; // Stop if file upload failed
      }
    }
    
    const announcementData = {
      title: formData.title,
      description: formData.description,
      image_url: fileUrl || null,
      target_type: formData.target_type,
      target_ids: formData.target_type === 'single' || formData.target_type === 'multiple' ? formData.target_ids : null,
      target_class: formData.target_type === 'class_section' ? formData.target_class || null : null,
      target_section: formData.target_type === 'class_section' ? formData.target_section || null : null,
      post_date: formData.post_date,
      is_read: false,
      sent_by: 'admin'
    };

    if (editingAnnouncement) {
      const { error } = await supabase
        .from('announcements')
        .update(announcementData)
        .eq('id', editingAnnouncement.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update announcement",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Announcement updated successfully",
        });
        
        // Send push notification if requested
        if (formData.send_push_notification) {
          await sendPushNotification(announcementData, fileUrl);
        }
        
        setEditingAnnouncement(null);
        fetchAnnouncements();
      }
    } else {
      const { error } = await supabase
        .from('announcements')
        .insert([announcementData]);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create announcement",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Announcement created successfully",
        });
        
        // Send push notification if requested
        if (formData.send_push_notification) {
          await sendPushNotification(announcementData, fileUrl);
        }
        
        fetchAnnouncements();
      }
    }
    
    resetForm();
  };

  const sendPushNotification = async (announcementData: any, imageUrl?: string) => {
    try {
      setSendingNotification(true);
      
      const { data, error } = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          targetType: announcementData.target_type,
          targetIds: announcementData.target_ids,
          targetClass: announcementData.target_class,
          targetSection: announcementData.target_section,
          title: announcementData.title,
          description: announcementData.description,
          imageUrl: imageUrl
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Push Notification Sent",
        description: data.message,
      });
    } catch (error) {
      console.error('Push notification error:', error);
      toast({
        title: "Push Notification Failed",
        description: "Failed to send push notification",
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      target_type: 'whole_school',
      target_ids: [],
      target_class: '',
      target_section: '',
      post_date: new Date().toISOString().split('T')[0],
      send_push_notification: false
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      fetchAnnouncements();
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      description: announcement.description || '',
      image_url: announcement.image_url || '',
      target_type: announcement.target_type || 'whole_school',
      target_ids: announcement.target_ids || [],
      target_class: announcement.target_class || '',
      target_section: announcement.target_section || '',
      post_date: announcement.post_date || new Date().toISOString().split('T')[0],
      send_push_notification: false
    });
  };

  const handleResendPush = async (announcement: Announcement) => {
    await sendPushNotification({
      target_type: announcement.target_type,
      target_ids: announcement.target_ids,
      target_class: announcement.target_class,
      target_section: announcement.target_section,
      title: announcement.title,
      description: announcement.description
    }, announcement.image_url);
  };

  const getTargetDisplayText = (announcement: Announcement) => {
    switch (announcement.target_type) {
      case 'single':
        return `Student: ${announcement.target_ids?.[0] || 'Unknown'}`;
      case 'multiple':
        return `Students: ${announcement.target_ids?.length || 0} selected`;
      case 'class_section':
        return `Class ${announcement.target_class || 'All'}${announcement.target_section ? ` - ${announcement.target_section}` : ''}`;
      case 'whole_school':
        return 'Whole School';
      default:
        return announcement.target_class || 'All Classes';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            View Announcements
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Announcement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterTargetType} onValueChange={setFilterTargetType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Targets</SelectItem>
                      <SelectItem value="whole_school">Whole School</SelectItem>
                      <SelectItem value="class_section">Class/Section</SelectItem>
                      <SelectItem value="multiple">Multiple Students</SelectItem>
                      <SelectItem value="single">Single Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                        <p className="text-muted-foreground mb-3">{announcement.description}</p>
                        {announcement.image_url && (
                          <div className="mb-3">
                            {announcement.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img 
                                src={announcement.image_url} 
                                alt="Announcement" 
                                className="max-w-sm h-32 object-cover rounded"
                              />
                            ) : (
                              <a 
                                href={announcement.image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                              >
                                <File className="h-4 w-4" />
                                View Attachment
                              </a>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(announcement.post_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{getTargetDisplayText(announcement)}</span>
                          </div>
                          {announcement.sent_by && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>By: {announcement.sent_by}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleResendPush(announcement)}
                          disabled={sendingNotification}
                          title="Resend push notification"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAnnouncements.length === 0 && announcements.length > 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No announcements match your search criteria.
                  </p>
                )}
                {announcements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No announcements found. Create your first announcement above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter announcement description..."
                    required
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Attachment (optional)</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf,.doc,.docx"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFileSelect}
                      disabled={uploadingFile}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? selectedFile.name : 'Browse from device'}
                    </Button>
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <File className="h-4 w-4" />
                        <span>Selected: {selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    {formData.image_url && !selectedFile && (
                      <div className="text-sm text-muted-foreground">
                        Current file: <a href={formData.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="target_type">Target Audience *</Label>
                  <Select 
                    value={formData.target_type} 
                    onValueChange={(value: 'single' | 'multiple' | 'class_section' | 'whole_school') => 
                      setFormData({ ...formData, target_type: value, target_ids: [], target_class: '', target_section: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whole_school">Whole School</SelectItem>
                      <SelectItem value="class_section">Specific Class/Section</SelectItem>
                      <SelectItem value="multiple">Multiple Students</SelectItem>
                      <SelectItem value="single">Single Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === 'single' && (
                  <div>
                    <Label htmlFor="single_student">Select Student</Label>
                    <Select 
                      value={formData.target_ids[0] || ''} 
                      onValueChange={(value) => setFormData({ ...formData, target_ids: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.value} value={student.value}>
                            {student.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.target_type === 'multiple' && (
                  <div>
                    <Label htmlFor="multiple_students">Select Students</Label>
                    <MultiSelect
                      options={students}
                      selected={formData.target_ids}
                      onChange={(selected) => setFormData({ ...formData, target_ids: selected })}
                      placeholder="Select students..."
                    />
                  </div>
                )}

                {formData.target_type === 'class_section' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target_class">Target Class</Label>
                      <Select 
                        value={formData.target_class} 
                        onValueChange={(value) => setFormData({ ...formData, target_class: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target_section">Target Section (optional)</Label>
                      <Input
                        id="target_section"
                        value={formData.target_section}
                        onChange={(e) => setFormData({ ...formData, target_section: e.target.value })}
                        placeholder="Enter section..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_push_notification"
                    checked={formData.send_push_notification}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_push_notification: !!checked })}
                  />
                  <Label htmlFor="send_push_notification" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send as Push Notification
                  </Label>
                </div>
                <div>
                  <Label htmlFor="post_date">Post Date</Label>
                  <Input
                    id="post_date"
                    type="date"
                    value={formData.post_date}
                    onChange={(e) => setFormData({ ...formData, post_date: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploadingFile || sendingNotification}>
                    {sendingNotification ? 'Sending...' : uploadingFile ? 'Uploading...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </Button>
                  {editingAnnouncement && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingAnnouncement(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
