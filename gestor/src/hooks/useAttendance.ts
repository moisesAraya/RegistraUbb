import { useState, useEffect } from 'react';
import { AttendanceRecord, DashboardStats } from '../types';

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    presentToday: 0,
    attendanceRate: 0,
    pendingJustifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = () => {
    setLoading(true);
    
    // Mock data for demonstration
    const mockRecords: AttendanceRecord[] = [
      {
        id: '1',
        userId: '1',
        userName: 'Prof. Ana López',
        date: new Date(2024, 0, 15), // 15 de enero
        checkInTime: new Date(2024, 0, 15, 8, 30),
        checkOutTime: new Date(2024, 0, 15, 17, 45),
        activityType: 'teaching',
        location: 'Sala 101',
        notes: 'Clase de Programación',
        isJustified: false,
        status: 'present'
      },
      {
        id: '2',
        userId: '2',
        userName: 'Dr. Carlos Mendoza',
        date: new Date(2024, 0, 16), // 16 de enero
        checkInTime: new Date(2024, 0, 16, 9, 15),
        checkOutTime: new Date(2024, 0, 16, 18, 30),
        activityType: 'research',
        location: 'Laboratorio',
        notes: 'Investigación en IA',
        isJustified: false,
        status: 'present'
      },
      {
        id: '3',
        userId: '1',
        userName: 'Prof. Ana López',
        date: new Date(2024, 0, 17), // 17 de enero
        checkInTime: new Date(2024, 0, 17, 8, 45),
        checkOutTime: new Date(2024, 0, 17, 16, 30),
        activityType: 'management',
        location: 'Oficina',
        notes: 'Reunión de coordinación',
        isJustified: false,
        status: 'present'
      },
      {
        id: '4',
        userId: '1',
        userName: 'Prof. Ana López',
        date: new Date(2024, 0, 18), // 18 de enero
        checkInTime: new Date(2024, 0, 18, 9, 30),
        activityType: 'teaching',
        location: 'Sala 205',
        notes: 'Clase de Base de Datos',
        isJustified: true,
        justificationReason: 'Llegada tardía por problema de transporte',
        status: 'late'
      },
      {
        id: '5',
        userId: '1',
        userName: 'Prof. Ana López',
        date: new Date(2024, 0, 19), // 19 de enero
        checkInTime: new Date(2024, 0, 19, 8, 15),
        checkOutTime: new Date(2024, 0, 19, 17, 0),
        activityType: 'teaching',
        location: 'Sala 101',
        notes: 'Laboratorio de programación',
        isJustified: false,
        status: 'present'
      }
    ];

    setAttendanceRecords(mockRecords);
    setDashboardStats({
      presentToday: 32,
      attendanceRate: 85.5,
      pendingJustifications: 3,
      weeklyHours: 38.5,
      requiredWeeklyHours: 44
    });
    setLoading(false);
  };

  const checkOut = async (recordId: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, checkOutTime: new Date() }
          : record
      )
    );
    return { success: true };
  };

  const submitJustification = async (recordId: string, reason: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, justificationReason: reason, isJustified: true }
          : record
      )
    );
    return { success: true };
  };

  return {
    attendanceRecords,
    dashboardStats,
    loading,
    checkOut,
    submitJustification,
    loadAttendanceData
  };
};