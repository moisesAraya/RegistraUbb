export interface User {
  id: string;
  email: string;
  name: string;
  role: 'academic' | 'secretary' | 'department_head' | 'administrator';
  department: string;
  createdAt: Date;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  activityType: 'Docencia' | 'research' | 'management' | 'other';
  location?: string;
  notes?: string;
  isJustified: boolean;
  justificationReason?: string;
  approvedBy?: string;
  status: 'present' | 'absent' | 'late' | 'justified';
}

export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'semanal' | 'yearly';
  dateRange: {
    start: Date;
    end: Date;
  };
  userId?: string;
  activityType?: string;
  generatedBy: string;
  createdAt: Date;
}

export interface DashboardStats {
  presentToday: number;
  attendanceRate: number;
  pendingJustifications: number;
  weeklyHours: number;
  requiredWeeklyHours: number;
}