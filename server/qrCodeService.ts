import QRCode from 'qrcode';
import crypto from 'crypto';

export interface QRCodeData {
  appointmentId: string;
  tokenNumber: string;
  citizenId: string;
  departmentId: string;
  serviceId: string;
  appointmentDate: string;
  timeSlot: string;
  generatedAt: string;
  expiresAt: string;
}

export interface OTPData {
  appointmentId: string;
  tokenNumber: string;
  code: string;
  generatedAt: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
}

export class QRCodeService {
  private static qrCodeCache = new Map<string, QRCodeData>();
  private static otpCache = new Map<string, OTPData>();

  /**
   * Generate QR code for appointment
   */
  static async generateQRCode(appointment: any): Promise<{
    qrCodeData: QRCodeData;
    qrCodeImage: string;
    qrCodeUrl: string;
  }> {
    const appointmentId = appointment.id;
    const tokenNumber = appointment.tokenNumber;
    
    // Check if QR code already exists and is valid
    const existing = this.qrCodeCache.get(appointmentId);
    if (existing && new Date(existing.expiresAt) > new Date()) {
      const qrCodeImage = await this.generateQRCodeImage(existing);
      return {
        qrCodeData: existing,
        qrCodeImage,
        qrCodeUrl: this.generateQRCodeUrl(existing)
      };
    }

    // Generate new QR code data
    const qrCodeData: QRCodeData = {
      appointmentId,
      tokenNumber,
      citizenId: appointment.citizenId,
      departmentId: appointment.departmentId,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Cache the QR code data
    this.qrCodeCache.set(appointmentId, qrCodeData);

    // Generate QR code image
    const qrCodeImage = await this.generateQRCodeImage(qrCodeData);
    const qrCodeUrl = this.generateQRCodeUrl(qrCodeData);

    return {
      qrCodeData,
      qrCodeImage,
      qrCodeUrl
    };
  }

  /**
   * Generate OTP for appointment
   */
  static generateOTP(appointment: any): OTPData {
    const appointmentId = appointment.id;
    const tokenNumber = appointment.tokenNumber;
    
    // Check if OTP already exists and is valid
    const existing = this.otpCache.get(appointmentId);
    if (existing && new Date(existing.expiresAt) > new Date() && existing.attempts < existing.maxAttempts) {
      return existing;
    }

    // Generate new OTP
    const code = this.generateRandomOTP(6);
    const otpData: OTPData = {
      appointmentId,
      tokenNumber,
      code,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      attempts: 0,
      maxAttempts: 3
    };

    // Cache the OTP data
    this.otpCache.set(appointmentId, otpData);

    return otpData;
  }

  /**
   * Verify QR code
   */
  static verifyQRCode(qrCodeData: string): {
    valid: boolean;
    appointmentId?: string;
    error?: string;
  } {
    try {
      const data: QRCodeData = JSON.parse(qrCodeData);
      
      // Check if QR code exists in cache
      const cached = this.qrCodeCache.get(data.appointmentId);
      if (!cached) {
        return { valid: false, error: 'QR code not found' };
      }

      // Check if QR code has expired
      if (new Date(data.expiresAt) <= new Date()) {
        this.qrCodeCache.delete(data.appointmentId);
        return { valid: false, error: 'QR code has expired' };
      }

      // Verify data integrity
      if (cached.tokenNumber !== data.tokenNumber ||
          cached.citizenId !== data.citizenId ||
          cached.departmentId !== data.departmentId) {
        return { valid: false, error: 'QR code data mismatch' };
      }

      return { valid: true, appointmentId: data.appointmentId };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Verify OTP
   */
  static verifyOTP(appointmentId: string, code: string): {
    valid: boolean;
    error?: string;
  } {
    const otpData = this.otpCache.get(appointmentId);
    
    if (!otpData) {
      return { valid: false, error: 'OTP not found' };
    }

    // Check if OTP has expired
    if (new Date(otpData.expiresAt) <= new Date()) {
      this.otpCache.delete(appointmentId);
      return { valid: false, error: 'OTP has expired' };
    }

    // Check if max attempts exceeded
    if (otpData.attempts >= otpData.maxAttempts) {
      this.otpCache.delete(appointmentId);
      return { valid: false, error: 'Maximum attempts exceeded' };
    }

    // Increment attempts
    otpData.attempts++;

    // Verify code
    if (otpData.code !== code) {
      return { valid: false, error: 'Invalid OTP code' };
    }

    // OTP is valid, remove from cache
    this.otpCache.delete(appointmentId);
    return { valid: true };
  }

  /**
   * Generate QR code image
   */
  private static async generateQRCodeImage(qrCodeData: QRCodeData): Promise<string> {
    const qrCodeString = JSON.stringify(qrCodeData);
    
    try {
      const qrCodeImage = await QRCode.toDataURL(qrCodeString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      return qrCodeImage;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code URL for mobile scanning
   */
  private static generateQRCodeUrl(qrCodeData: QRCodeData): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/checkin?data=${encodeURIComponent(JSON.stringify(qrCodeData))}`;
  }

  /**
   * Generate random OTP
   */
  private static generateRandomOTP(length: number): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Clean up expired QR codes and OTPs
   */
  static cleanupExpired(): void {
    const now = new Date();
    
    // Clean up expired QR codes
    for (const [appointmentId, qrCodeData] of this.qrCodeCache.entries()) {
      if (new Date(qrCodeData.expiresAt) <= now) {
        this.qrCodeCache.delete(appointmentId);
      }
    }
    
    // Clean up expired OTPs
    for (const [appointmentId, otpData] of this.otpCache.entries()) {
      if (new Date(otpData.expiresAt) <= now) {
        this.otpCache.delete(appointmentId);
      }
    }
  }

  /**
   * Get QR code data for appointment
   */
  static getQRCodeData(appointmentId: string): QRCodeData | null {
    return this.qrCodeCache.get(appointmentId) || null;
  }

  /**
   * Get OTP data for appointment
   */
  static getOTPData(appointmentId: string): OTPData | null {
    return this.otpCache.get(appointmentId) || null;
  }

  /**
   * Invalidate QR code
   */
  static invalidateQRCode(appointmentId: string): void {
    this.qrCodeCache.delete(appointmentId);
  }

  /**
   * Invalidate OTP
   */
  static invalidateOTP(appointmentId: string): void {
    this.otpCache.delete(appointmentId);
  }
}

// Clean up expired codes every 5 minutes
setInterval(() => {
  QRCodeService.cleanupExpired();
}, 5 * 60 * 1000);

export const qrCodeService = new QRCodeService();
