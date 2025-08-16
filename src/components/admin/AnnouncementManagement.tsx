import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Trash2, Edit, Calendar, Users, Upload, File, MessageSquare, Plus, Send, Bell, Filter, Search } from 'lucide-react';

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

type Student = {
  id: string;
  name: string;
  class: string;
  section: string;
};

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
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
    send_notification: false
  });
  const { toast } = useToast();

  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    fetchAnnouncements();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, class, section')
      .order('name');
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
  };

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

  const sendPushNotification = async (announcement: any, fileUrl?: string) => {
    try {
      setSendingNotification(true);
      
      const response = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          targetType: announcement.target_type,
          targetIds: announcement.target_ids,
          targetClass: announcement.target_class,
          targetSection: announcement.target_section,
          title: announcement.title,
          description: announcement.description,
          imageUrl: fileUrl || announcement.image_url || ''
        }
      });

      console.log('FCM response:', response);

      if (response.error) {
        console.error('FCM function error:', response.error);
        throw new Error(response.error.message || 'Failed to send push notification');
      }

      const data = response.data;
      if (data?.success) {
        toast({
          title: "Success",
          description: data.message || "Push notification sent successfully",
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Push notification error:', error);
      toast({
        title: "Warning", 
        description: "Announcement created but push notification failed. Please check if the student_tokens table exists and has FCM tokens.",
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
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
      target_ids: formData.target_ids.length > 0 ? formData.target_ids : null,
      target_class: formData.target_type === 'class_section' ? formData.target_class : null,
      target_section: formData.target_type === 'class_section' ? formData.target_section : null,
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
        if (formData.send_notification) {
          await sendPushNotification(announcementData, fileUrl);
        }
        
        fetchAnnouncements();
      }
    }
    
    resetForm();
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
      send_notification: false
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
      send_notification: false
    });
  };

  const handleResendPush = async (announcement: Announcement) => {
    await sendPushNotification(announcement);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || announcement.target_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTargetDisplay = (announcement: Announcement) => {
    if (announcement.target_type === 'single' && announcement.target_ids?.length) {
      const student = students.find(s => s.id === announcement.target_ids?.[0]);
      return student ? `Student: ${student.name}` : 'Single Student';
    } else if (announcement.target_type === 'multiple' && announcement.target_ids?.length) {
      return `${announcement.target_ids.length} Students`;
    } else if (announcement.target_type === 'class_section') {
      return `${announcement.target_class || 'All Classes'}${announcement.target_section ? ` - ${announcement.target_section}` : ''}`;
    } else {
      return 'Whole School';
    }
  };

  const studentOptions: MultiSelectOption[] = students.map(student => ({
    label: `${student.name} (${student.class} - ${student.section})`,
    value: student.id
  }));

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
              <CardTitle className="flex items-center justify-between">
                Recent Announcements
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search announcements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="whole_school">Whole School</SelectItem>
                      <SelectItem value="class_section">Class/Section</SelectItem>
                      <SelectItem value="multiple">Multiple Students</SelectItem>
                      <SelectItem value="single">Single Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {getTargetDisplay(announcement)}
                          </Badge>
                        </div>
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
                          title="Resend Push Notification"
                        >
                          <Bell className="h-4 w-4" />
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
                {filteredAnnouncements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm || filterType !== 'all' ? 'No announcements match your search criteria.' : 'No announcements found. Create your first announcement above.'}
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
                    onValueChange={(value: any) => setFormData({ ...formData, target_type: value, target_ids: [], target_class: '', target_section: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whole_school">Whole School</SelectItem>
                      <SelectItem value="class_section">Class/Section</SelectItem>
                      <SelectItem value="multiple">Multiple Students</SelectItem>
                      <SelectItem value="single">Single Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                 {formData.target_type === 'single' && (
                   <div>
                     <Label htmlFor="single_student">Select Student *</Label>
                     <Select 
                       value={formData.target_ids?.[0] || ''} 
                       onValueChange={(value) => setFormData({ ...formData, target_ids: [value] })}
                     >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.class} - {student.section})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                 {formData.target_type === 'multiple' && (
                   <div>
                     <Label htmlFor="multiple_students">Select Students *</Label>
                     <MultiSelect
                       options={studentOptions}
                       selected={formData.target_ids || []}
                       onChange={(values) => setFormData({ ...formData, target_ids: values })}
                       placeholder="Select multiple students"
                       className="w-full"
                     />
                   </div>
                 )}

                {formData.target_type === 'class_section' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target_class">Target Class *</Label>
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
                        placeholder="Enter section (leave empty for all sections)"
                      />
                    </div>
                  </div>
                )}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_notification"
                    checked={formData.send_notification}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_notification: !!checked })}
                  />
                  <Label htmlFor="send_notification" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Send as Push Notification
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploadingFile || sendingNotification}>
                    {uploadingFile ? 'Uploading...' : sendingNotification ? 'Sending...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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
