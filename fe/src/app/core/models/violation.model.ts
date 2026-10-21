export type ReviewStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Bảng violation_types */
export interface ViolationType {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

/** Bảng camera_logs */
export interface Violation {
  id: number;
  cameraId: number;
  cameraName?: string;
  personId?: number | null;
  personName?: string | null;
  personCode?: string | null;
  violationTypeId: number;
  violationTypeName: string;
  violationTypeCode: string;
  detectedAt: string;
  /** 0..1 */
  confidence: number;
  imageUrl?: string;
  reviewStatus: ReviewStatus;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  sourceEventId: string;
}

export interface ViolationFilter {
  from?: string;
  to?: string;
  personId?: number;
  violationTypeId?: number;
  cameraId?: number;
  reviewStatus?: ReviewStatus;
}

export interface ReviewRequest {
  reviewStatus: Exclude<ReviewStatus, 'PENDING'>;
  reviewNote?: string;
}

export const REVIEW_LABEL: Record<ReviewStatus, string> = {
  PENDING: 'Chờ duyệt',
  VERIFIED: 'Đã xác minh',
  REJECTED: 'Đã bác bỏ',
};
