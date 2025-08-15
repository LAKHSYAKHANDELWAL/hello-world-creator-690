import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Calendar, Users, Upload, File, MessageSquare, Plus, Send, Filter, Search } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  target_type: 'single' | 'multiple' | 'class_section' | 'whole_school';
  target_ids?: string[];
  target_class?: string;
  target_section?: string;
  post_date: string;
  created_at: string;
  is_read: boolean;
  sent_by?: string;
};

type Student = {
  id: string;
  full_name: string;
  name: string;
  class: string;
  section: string;
  login_id: string;
};

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingPush, setSendingPush] = useState(false);
  const [filterTargetType, setFilterTargetType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
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
    send_push: false,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.target_class) {
      fetchSections(formData.target_class);
    }
  }, [formData.target_class]);

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
      .select('id, full_name, name, class, section, login_id')
      .order('class')
      .order('full_name');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } else {
      setStudents(data || []);
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('class')
      .not('class', 'is', null);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
      return;
    }

    const uniqueClasses = [...new Set(data.map(item => item.class))].sort();
    setClasses(uniqueClasses);
  };

  const fetchSections = async (className: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('section')
      .eq('class', className)
      .not('section', 'is', null);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sections",
        variant: "destructive",
      });
      return;
    }

    const uniqueSections = [...new Set(data.map(item => item.section))].sort();
    setSections(uniqueSections);
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

  const sendPushNotification = async (announcement: Announcement) => {
    try {
      setSendingPush(true);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          announcementId: announcement.id,
          title: announcement.title,
          body: announcement.description,
          imageUrl: announcement.image_url,
          targetType: announcement.target_type,
          targetIds: announcement.target_ids,
          targetClass: announcement.target_class,
          targetSection: announcement.target_section,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Push Notification Sent",
          description: `Successfully sent to ${result.sentCount} device(s)`,
        });
      } else {
        toast({
          title: "Push Notification Failed",
          description: result.message || "Failed to send push notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send push notification",
        variant: "destructive",
      });
    } finally {
      setSendingPush(false);
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
      sent_by: 'Admin', // Replace with actual admin name when auth is implemented
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
        return;
      } else {
        toast({
          title: "Success",
          description: "Announcement updated successfully",
        });
        setEditingAnnouncement(null);
      }
    } else {
      const { data: newAnnouncement, error } = await supabase
        .from('announcements')
        .insert([announcementData])
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create announcement",
          variant: "destructive",
        });
        return;
      } else {
        toast({
          title: "Success",
          description: "Announcement created successfully",
        });
        
        // Send push notification if requested
        if (formData.send_push && newAnnouncement) {
          await sendPushNotification(newAnnouncement);
        }
      }
    }
    
    fetchAnnouncements();
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
      send_push: false,
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
      send_push: false,
    });
  };

  const handleResendPush = async (announcement: Announcement) => {
    await sendPushNotification(announcement);
  };

  const getTargetDisplay = (announcement: Announcement) => {
    switch (announcement.target_type) {
      case 'single':
        const singleStudent = students.find(s => s.id === announcement.target_ids?.[0]);
        return `Student: ${singleStudent?.full_name || singleStudent?.name || 'Unknown'}`;
      case 'multiple':
        return `${announcement.target_ids?.length || 0} Students`;
      case 'class_section':
        return `${announcement.target_class}${announcement.target_section ? ` - ${announcement.target_section}` : ''}`;
      case 'whole_school':
        return 'Whole School';
      default:
        return 'Unknown';
    }
  };

  const getFilteredAnnouncements = () => {
    return announcements.filter(announcement => {
      const matchesTargetType = filterTargetType === 'all' || announcement.target_type === filterTargetType;
      const matchesSearch = searchTerm === '' || 
        announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTargetType && matchesSearch;
    });
  };

  const getStudentsForClass = (className: string) => {
    return students.filter(s => s.class === className);
  };

  const handleTargetIdsChange = (studentIds: string[]) => {
    setFormData(prev => ({ ...prev, target_ids: studentIds }));
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
              <CardTitle>Recent Announcements</CardTitle>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={filterTargetType} onValueChange={setFilterTargetType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Targets</SelectItem>
                      <SelectItem value="single">Single Student</SelectItem>
                      <SelectItem value="multiple">Multiple Students</SelectItem>
                      <SelectItem value="class_section">Class/Section</SelectItem>
                      <SelectItem value="whole_school">Whole School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredAnnouncements().map((announcement) => (
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
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(announcement.post_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{getTargetDisplay(announcement)}</span>
                          </div>
                          {announcement.sent_by && (
                            <div>
                              <span>By: {announcement.sent_by}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={announcement.target_type === 'whole_school' ? 'default' : 'secondary'}>
                            {announcement.target_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {!announcement.is_read && (
                            <Badge variant="destructive">Unread</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleResendPush(announcement)}
                          disabled={sendingPush}
                          className="flex items-center gap-1"
                        >
                          <Send className="h-4 w-4" />
                          {sendingPush ? 'Sending...' : 'Resend Push'}
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
                {getFilteredAnnouncements().length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No announcements found matching your criteria.
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
                      <SelectItem value="class_section">Class/Section</SelectItem>
                      <SelectItem value="single">One Student</SelectItem>
                      <SelectItem value="multiple">Multiple Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target-specific inputs */}
                {formData.target_type === 'single' && (
                  <div>
                    <Label htmlFor="single_student">Select Student *</Label>
                    <Select 
                      value={formData.target_ids[0] || ''} 
                      onValueChange={(value) => setFormData({ ...formData, target_ids: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name || student.name} - {student.class} {student.section} ({student.login_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.target_type === 'multiple' && (
                  <div>
                    <Label>Select Students *</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={student.id}
                            checked={formData.target_ids.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleTargetIdsChange([...formData.target_ids, student.id]);
                              } else {
                                handleTargetIdsChange(formData.target_ids.filter(id => id !== student.id));
                              }
                            }}
                          />
                          <Label htmlFor={student.id} className="text-sm cursor-pointer">
                            {student.full_name || student.name} - {student.class} {student.section}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {formData.target_ids.length} student(s) selected
                    </p>
                  </div>
                )}

                {formData.target_type === 'class_section' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target_class">Target Class *</Label>
                      <Select 
                        value={formData.target_class} 
                        onValueChange={(value) => setFormData({ ...formData, target_class: value, target_section: '' })}
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
                      <Select 
                        value={formData.target_section} 
                        onValueChange={(value) => setFormData({ ...formData, target_section: value })}
                        disabled={!formData.target_class}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Sections</SelectItem>
                          {sections.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    id="send_push"
                    checked={formData.send_push}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_push: checked as boolean })}
                  />
                  <Label htmlFor="send_push" className="text-sm font-medium cursor-pointer">
                    Send as Push Notification
                  </Label>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploadingFile || sendingPush}>
                    {uploadingFile ? 'Uploading...' : sendingPush ? 'Sending...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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