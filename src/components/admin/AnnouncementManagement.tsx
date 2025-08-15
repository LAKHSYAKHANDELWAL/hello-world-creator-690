import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Calendar, Users, Upload, File, MessageSquare, Plus } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  target_class?: string;
  target_section?: string;
  post_date: string;
  created_at: string;
};

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    target_class: '',
    target_section: '',
    post_date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

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
      target_class: formData.target_class === 'all' ? null : formData.target_class || null,
      target_section: formData.target_section || null,
      post_date: formData.post_date
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
      target_class: '',
      target_section: '',
      post_date: new Date().toISOString().split('T')[0]
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
      target_class: announcement.target_class || '',
      target_section: announcement.target_section || '',
      post_date: announcement.post_date || new Date().toISOString().split('T')[0]
    });
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
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
                            <Users className="h-4 w-4" />
                            <span>
                              {announcement.target_class || 'All Classes'}
                              {announcement.target_section && ` - ${announcement.target_section}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_class">Target Class (optional)</Label>
                    <Select 
                      value={formData.target_class} 
                      onValueChange={(value) => setFormData({ ...formData, target_class: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class (all if empty)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
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
                  <Button type="submit" disabled={uploadingFile}>
                    {uploadingFile ? 'Uploading...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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
