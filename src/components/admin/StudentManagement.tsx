
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, Users, UserPlus, Eye, EyeOff } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  full_name: string;
  class: string;
  section: string;
  login_id: string;
  password: string;
  parent_name: string;
  parent_relation: string;
  phone1: string;
  phone2?: string;
  email?: string;
  address?: string;
  fee_status: string;
  sr_no?: number;
  dob?: string;
  mother_name?: string;
  previous_fee_pending?: number;
};

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const [formData, setFormData] = useState({
    sr_no: '',
    full_name: '',
    class: '',
    section: '',
    login_id: '',
    password: '',
    parent_name: '',
    parent_relation: '',
    phone1: '',
    phone2: '',
    email: '',
    address: '',
    fee_status: 'pending',
    dob: '',
    mother_name: '',
    previous_fee_pending: ''
  });
  const { toast } = useToast();

  const classes = Array.from({length: 12}, (_, i) => `Class ${i + 1}`);
  const parentRelations = ['Father', 'Mother', 'Guardian', 'Other'];
  const feeStatuses = ['Paid', 'Pending', 'Overdue'];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedClass, selectedSection]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
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

  const filterStudents = () => {
    let filtered = students;
    if (selectedClass && selectedClass !== 'all') {
      filtered = filtered.filter(s => s.class === selectedClass);
    }
    if (selectedSection) {
      filtered = filtered.filter(s => s.section === selectedSection);
    }
    setFilteredStudents(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const studentData = {
      name: formData.full_name,
      sr_no: formData.sr_no ? parseInt(formData.sr_no) : null,
      full_name: formData.full_name,
      class: formData.class,
      section: formData.section,
      login_id: formData.login_id,
      password: formData.password,
      parent_name: formData.parent_name,
      parent_relation: formData.parent_relation,
      phone1: formData.phone1,
      phone2: formData.phone2,
      email: formData.email,
      address: formData.address,
      fee_status: formData.fee_status,
      dob: formData.dob || null,
      mother_name: formData.mother_name,
      previous_fee_pending: formData.previous_fee_pending ? parseFloat(formData.previous_fee_pending) : null
    };

    if (editingStudent) {
      const { error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', editingStudent.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update student",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Student updated successfully",
        });
        setEditingStudent(null);
        setActiveTab('view');
        fetchStudents();
      }
    } else {
      const { error } = await supabase
        .from('students')
        .insert(studentData);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add student",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Student added successfully",
        });
        fetchStudents();
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      sr_no: '',
      full_name: '',
      class: '',
      section: '',
      login_id: '',
      password: '',
      parent_name: '',
      parent_relation: '',
      phone1: '',
      phone2: '',
      email: '',
      address: '',
      fee_status: 'pending',
      dob: '',
      mother_name: '',
      previous_fee_pending: ''
    });
    setShowPassword(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      fetchStudents();
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      sr_no: student.sr_no?.toString() || '',
      full_name: student.full_name || student.name || '',
      class: student.class,
      section: student.section || '',
      login_id: student.login_id,
      password: student.password,
      parent_name: student.parent_name || '',
      parent_relation: student.parent_relation || '',
      phone1: student.phone1 || '',
      phone2: student.phone2 || '',
      email: student.email || '',
      address: student.address || '',
      fee_status: student.fee_status || 'pending',
      dob: student.dob || '',
      mother_name: student.mother_name || '',
      previous_fee_pending: student.previous_fee_pending?.toString() || ''
    });
    setActiveTab('add');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            View Students
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                View Students
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-class">Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
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
                  <Label htmlFor="filter-section">Section</Label>
                  <Input
                    id="filter-section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    placeholder="Enter section (optional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Students List 
                    {(selectedClass !== 'all' || selectedSection) && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({filteredStudents.length} students found)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{student.full_name || student.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {student.class} {student.section && `- ${student.section}`} | 
                          Login: {student.login_id} | 
                          Fee: <span className={`capitalize ${
                            student.fee_status === 'paid' ? 'text-green-600' : 
                            student.fee_status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                          }`}>{student.fee_status}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No students found for the selected criteria.
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
                {editingStudent ? (
                  <span className="text-blue-600">Edit Student - {editingStudent.full_name || editingStudent.name}</span>
                ) : (
                  'Add New Student'
                )}
              </CardTitle>
              {editingStudent && (
                <p className="text-sm text-muted-foreground">
                  You are currently editing this student's information.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sr_no">Sr. No.</Label>
                    <Input
                      id="sr_no"
                      type="number"
                      value={formData.sr_no}
                      onChange={(e) => setFormData({ ...formData, sr_no: e.target.value })}
                      placeholder="Enter serial number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class *</Label>
                    <Select 
                      value={formData.class} 
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
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
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    />
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
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_name">Parent Name</Label>
                    <Input
                      id="parent_name"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_name">Mother's Name</Label>
                    <Input
                      id="mother_name"
                      value={formData.mother_name}
                      onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_relation">Parent Relation</Label>
                    <Select 
                      value={formData.parent_relation} 
                      onValueChange={(value) => setFormData({ ...formData, parent_relation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentRelations.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone1">Phone No. 1</Label>
                    <Input
                      id="phone1"
                      value={formData.phone1}
                      onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone2">Phone No. 2 (Optional)</Label>
                    <Input
                      id="phone2"
                      value={formData.phone2}
                      onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email ID</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fee_status">Fee Status</Label>
                    <Select 
                      value={formData.fee_status} 
                      onValueChange={(value) => setFormData({ ...formData, fee_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee status" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeStatuses.map((status) => (
                          <SelectItem key={status} value={status.toLowerCase()}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="previous_fee_pending">Previous Year Fee</Label>
                    <Input
                      id="previous_fee_pending"
                      type="number"
                      step="0.01"
                      value={formData.previous_fee_pending}
                      onChange={(e) => setFormData({ ...formData, previous_fee_pending: e.target.value })}
                      placeholder="Enter previous year fee pending"
                    />
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
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingStudent ? 'Update Student' : 'Add Student'}
                  </Button>
                  {editingStudent && (
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
