
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Users, UserPlus, Eye, EyeOff } from 'lucide-react';

type Teacher = {
  id: string;
  name: string;
  assigned_classes: string[];
  login_id: string;
  password: string;
  subject?: string;
  phone?: string;
  email?: string;
  address?: string;
  role?: string;
};

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const [formData, setFormData] = useState({
    name: '',
    assigned_classes: [] as string[],
    login_id: '',
    password: '',
    subject: '',
    phone: '',
    email: '',
    address: '',
    role: ''
  });
  const { toast } = useToast();

  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);
  const subjects = [
    'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Physics', 
    'Chemistry', 'Biology', 'Geography', 'History', 'Economics', 'Commerce'
  ];
  const roles = ['Subject Teacher', 'Class Teacher', 'Head Teacher', 'Principal', 'Vice Principal'];

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [teachers, filterClass, filterSubject, filterRole]);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch teachers",
        variant: "destructive",
      });
    } else {
      setTeachers(data || []);
    }
  };

  const filterTeachers = () => {
    let filtered = teachers;
    if (filterClass && filterClass !== 'all') {
      filtered = filtered.filter(t => 
        t.assigned_classes?.includes(filterClass)
      );
    }
    if (filterSubject) {
      filtered = filtered.filter(t => 
        t.subject?.toLowerCase().includes(filterSubject.toLowerCase())
      );
    }
    if (filterRole) {
      filtered = filtered.filter(t => 
        t.role?.toLowerCase().includes(filterRole.toLowerCase())
      );
    }
    setFilteredTeachers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const teacherData = {
      ...formData,
    };

    if (editingTeacher) {
      const { error } = await supabase
        .from('teachers')
        .update(teacherData)
        .eq('id', editingTeacher.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update teacher",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Teacher updated successfully",
        });
        setEditingTeacher(null);
        setActiveTab('view');
        fetchTeachers();
      }
    } else {
      const { error } = await supabase
        .from('teachers')
        .insert([teacherData]);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add teacher",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Teacher added successfully",
        });
        fetchTeachers();
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      assigned_classes: [],
      login_id: '',
      password: '',
      subject: '',
      phone: '',
      email: '',
      address: '',
      role: ''
    });
    setShowPassword(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      fetchTeachers();
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      assigned_classes: teacher.assigned_classes || [],
      login_id: teacher.login_id,
      password: teacher.password,
      subject: teacher.subject || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      role: teacher.role || ''
    });
    setActiveTab('add');
    // Scroll to top of form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingTeacher(null);
    resetForm();
  };

  const handleClassToggle = (className: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        assigned_classes: [...prev.assigned_classes, className]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assigned_classes: prev.assigned_classes.filter(c => c !== className)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            View Teachers
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                View Teachers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filter-class">Filter by Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
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
                  <Label htmlFor="filter-subject">Filter by Subject</Label>
                  <Input
                    id="filter-subject"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <Label htmlFor="filter-role">Filter by Role</Label>
                  <Input
                    id="filter-role"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    placeholder="Enter role"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Teachers List 
                    {(filterClass !== 'all' || filterSubject || filterRole) && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({filteredTeachers.length} teachers found)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredTeachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{teacher.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {teacher.subject && `${teacher.subject} | `}
                          {teacher.role && `${teacher.role} | `}
                          Classes: {teacher.assigned_classes?.join(', ') || 'None'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(teacher)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(teacher.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No teachers found for the selected criteria.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {editingTeacher ? (
                  <span className="text-blue-600">Edit Teacher - {editingTeacher.name}</span>
                ) : (
                  'Add New Teacher'
                )}
              </CardTitle>
              {editingTeacher && (
                <p className="text-sm text-muted-foreground">
                  You are currently editing this teacher's information.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="login_id">Login ID *</Label>
                    <Input
                      id="login_id"
                      value={formData.login_id}
                      onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Assigned Classes (Multi-select)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {classes.map((className) => (
                      <div key={className} className="flex items-center space-x-2">
                        <Checkbox
                          id={className}
                          checked={formData.assigned_classes.includes(className)}
                          onCheckedChange={(checked) => handleClassToggle(className, checked as boolean)}
                        />
                        <Label htmlFor={className} className="text-sm">
                          {className}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                  </Button>
                  {editingTeacher && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                    >
                      Cancel Edit
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
