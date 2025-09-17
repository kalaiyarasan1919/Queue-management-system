import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building, Calendar, Clock, CheckCircle, TrendingUp, Settings, Plus, Edit, BarChart3, Megaphone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  nameHi: z.string().optional(),
  nameTa: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  workingHours: z.object({
    start: z.string().min(1, "Start time is required"),
    end: z.string().min(1, "End time is required"),
  }),
});

const serviceSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  name: z.string().min(1, "Service name is required"),
  nameHi: z.string().optional(),
  nameTa: z.string().optional(),
  description: z.string().optional(),
  estimatedTime: z.number().min(1, "Estimated time must be at least 1 minute"),
});

const counterSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  number: z.number().min(1, "Counter number is required"),
  clerkId: z.string().optional(),
});

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  titleHi: z.string().optional(),
  titleTa: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  messageHi: z.string().optional(),
  messageTa: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;
type CounterFormData = z.infer<typeof counterSchema>;
type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  const departmentForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      workingHours: { start: "09:00", end: "17:00" }
    }
  });

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      estimatedTime: 15
    }
  });

  const counterForm = useForm<CounterFormData>({
    resolver: zodResolver(counterSchema),
  });

  const announcementForm = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
  });

  // Queries
  const { data: systemStats } = useQuery({
    queryKey: ['/api/analytics/system'],
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: clerks } = useQuery({
    queryKey: ['/api/users', 'clerk'],
  });

  const { data: announcements } = useQuery({
    queryKey: ['/api/announcements'],
  });

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      await apiRequest('POST', '/api/departments', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      departmentForm.reset();
      setDepartmentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: t('msg.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      await apiRequest('POST', '/api/services', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service created successfully",
      });
      serviceForm.reset();
      setServiceDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: t('msg.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      await apiRequest('POST', '/api/announcements', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      announcementForm.reset();
      setAnnouncementDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: t('msg.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Listen for real-time updates
  useEffect(() => {
    if (lastMessage?.type) {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/system'] });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    }
  }, [lastMessage, queryClient]);

  const onSubmitDepartment = (data: DepartmentFormData) => {
    createDepartmentMutation.mutate(data);
  };

  const onSubmitService = (data: ServiceFormData) => {
    createServiceMutation.mutate(data);
  };

  const onSubmitAnnouncement = (data: AnnouncementFormData) => {
    createAnnouncementMutation.mutate(data);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-muted-foreground">You must be an admin to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Today's Appointments</p>
                <p className="text-3xl font-bold text-primary" data-testid="stat-today-appointments">
                  {systemStats?.totalAppointments || 0}
                </p>
              </div>
              <Calendar className="text-primary text-3xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Counters</p>
                <p className="text-3xl font-bold text-secondary" data-testid="stat-active-counters">
                  {systemStats?.activeCounters || 0}/{systemStats?.totalCounters || 0}
                </p>
              </div>
              <Building className="text-secondary text-3xl" />
            </div>
            <p className="text-sm text-yellow-600 mt-2">
              {(systemStats?.totalCounters || 0) - (systemStats?.activeCounters || 0)} counters offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Wait Time</p>
                <p className="text-3xl font-bold text-accent" data-testid="stat-avg-wait-time">16m</p>
              </div>
              <Clock className="text-accent text-3xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">-3min from target</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600" data-testid="stat-completion-rate">
                  {systemStats?.completed && systemStats?.totalAppointments 
                    ? Math.round((systemStats.completed / systemStats.totalAppointments) * 100) + '%'
                    : '0%'
                  }
                </p>
              </div>
              <CheckCircle className="text-green-600 text-3xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">Above 90% target</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
          <TabsTrigger value="announcements" data-testid="tab-announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Department Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Building className="text-accent mr-2" />
                  Department Overview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {departments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No departments found. Create your first department to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Active Counters</TableHead>
                        <TableHead>Queue Length</TableHead>
                        <TableHead>Avg Wait</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map((dept: any) => (
                        <TableRow key={dept.id} data-testid={`row-department-${dept.id}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <i className={`fas fa-${dept.icon} text-blue-600 text-sm`}></i>
                              </div>
                              <span className="font-medium">{dept.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>6/8</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              42 people
                            </Badge>
                          </TableCell>
                          <TableCell>18 mins</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-edit-dept-${dept.id}`}>
                                <Edit size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-analytics-dept-${dept.id}`}>
                                <BarChart3 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="text-4xl mb-2 mx-auto" />
                  <p>Queue Analytics Chart</p>
                  <p className="text-sm">Real-time data visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Departments Management</h2>
            <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-department">
                  <Plus className="mr-2" size={16} />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Department</DialogTitle>
                </DialogHeader>
                <Form {...departmentForm}>
                  <form onSubmit={departmentForm.handleSubmit(onSubmitDepartment)} className="space-y-4">
                    <FormField
                      control={departmentForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Name (English)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. RTO Services" data-testid="input-dept-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={departmentForm.control}
                      name="nameHi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Name (Hindi)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. आरटीओ सेवाएं" data-testid="input-dept-name-hi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={departmentForm.control}
                      name="nameTa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Name (Tamil)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. ஆர்டிஓ சேவைகள்" data-testid="input-dept-name-ta" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={departmentForm.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-dept-icon">
                                <SelectValue placeholder="Select Icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="car">Car (RTO)</SelectItem>
                              <SelectItem value="file-alt">Document (Certificates)</SelectItem>
                              <SelectItem value="id-card">ID Card (Aadhar)</SelectItem>
                              <SelectItem value="building">Building (Municipal)</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={departmentForm.control}
                        name="workingHours.start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} data-testid="input-start-time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={departmentForm.control}
                        name="workingHours.end"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} data-testid="input-end-time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" disabled={createDepartmentMutation.isPending} data-testid="button-submit-department">
                        {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setDepartmentDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              {departments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No departments found. Create your first department above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments?.map((dept: any) => (
                    <Card key={dept.id} className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <i className={`fas fa-${dept.icon} text-primary`}></i>
                          <span>{dept.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Working Hours:</strong> {dept.workingHours.start} - {dept.workingHours.end}</p>
                          <p><strong>Status:</strong> <Badge className="bg-green-100 text-green-800">Active</Badge></p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Services Management</h2>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-service">
                  <Plus className="mr-2" size={16} />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                </DialogHeader>
                <Form {...serviceForm}>
                  <form onSubmit={serviceForm.handleSubmit(onSubmitService)} className="space-y-4">
                    <FormField
                      control={serviceForm.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-department">
                                <SelectValue placeholder="Select Department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments?.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name (English)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Driving License Renewal" data-testid="input-service-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Brief description of the service" data-testid="textarea-service-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceForm.control}
                      name="estimatedTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Time (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-service-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button type="submit" disabled={createServiceMutation.isPending} data-testid="button-submit-service">
                        {createServiceMutation.isPending ? "Creating..." : "Create Service"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                Services will be displayed here once departments are created and services are added.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Announcements</h2>
            <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-announcement">
                  <Megaphone className="mr-2" size={16} />
                  Add Announcement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                </DialogHeader>
                <Form {...announcementForm}>
                  <form onSubmit={announcementForm.handleSubmit(onSubmitAnnouncement)} className="space-y-4">
                    <FormField
                      control={announcementForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (English)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Announcement title" data-testid="input-announcement-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={announcementForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message (English)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Announcement message" data-testid="textarea-announcement-message" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={announcementForm.control}
                      name="titleHi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Hindi)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="हिंदी में शीर्षक" data-testid="input-announcement-title-hi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={announcementForm.control}
                      name="messageHi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message (Hindi)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="हिंदी में संदेश" data-testid="textarea-announcement-message-hi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button type="submit" disabled={createAnnouncementMutation.isPending} data-testid="button-submit-announcement">
                        {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              {announcements?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No announcements found. Create your first announcement above.
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements?.map((announcement: any) => (
                    <Card key={announcement.id} className="border-l-4 border-blue-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-2">{announcement.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(announcement.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="text-accent mr-2" />
            System Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline"
              className="justify-start h-auto p-4"
              data-testid="button-system-announcement"
            >
              <div className="flex flex-col items-start">
                <Megaphone className="mb-2" size={20} />
                <span className="font-medium">Send System Announcement</span>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="justify-start h-auto p-4"
              data-testid="button-manage-staff"
            >
              <div className="flex flex-col items-start">
                <Users className="mb-2" size={20} />
                <span className="font-medium">Manage Staff Assignments</span>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="justify-start h-auto p-4"
              data-testid="button-configure-holidays"
            >
              <div className="flex flex-col items-start">
                <Calendar className="mb-2" size={20} />
                <span className="font-medium">Configure Holidays</span>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="justify-start h-auto p-4"
              data-testid="button-export-reports"
            >
              <div className="flex flex-col items-start">
                <TrendingUp className="mb-2" size={20} />
                <span className="font-medium">Export Reports</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
