export interface Counter {
  id: string;
  number: number;
  status: 'active' | 'busy' | 'break' | 'offline';
  departmentId: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface Appointment {
  id: string;
  tokenNumber: string;
  citizenId: string;
  departmentId: string;
  serviceId: string;
  counterId?: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'confirmed' | 'waiting' | 'serving' | 'completed' | 'cancelled' | 'no_show';
  priority: 'normal' | 'senior' | 'disabled' | 'emergency';
  isPwd: boolean;
  pwdCertificateUrl?: string;
  isSeniorCitizen: boolean;
  ageProofUrl?: string;
  notificationEmail: string;
  queuePosition?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  estimatedWaitTime?: number;
  qrCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  citizen?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    role: string;
    qrCode: string | null;
  };
  department?: {
    id: string;
    name: string;
    nameHi?: string;
    nameTa?: string;
    icon: string;
    workingHours: any;
  };
  service?: {
    id: string;
    name: string;
    nameHi?: string;
    nameTa?: string;
    description?: string;
    estimatedTime: number;
  };
}

export interface TokenValidationResponse {
  valid: boolean;
  appointment?: Appointment;
  message?: string;
}
