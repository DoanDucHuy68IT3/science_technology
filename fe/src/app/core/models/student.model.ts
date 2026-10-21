/** Bảng persons (học sinh) */
export interface Student {
  id: number;
  personCode: string;
  fullName: string;
  location: string;          // lớp / nhóm (đồng bộ với camera_devices.location)
  userId?: number | null;    // user quản lý (persons.user_id)
  description?: string;
  isActive: boolean;
  /** Suy ra từ person_face_embeddings */
  faceRegistered: boolean;
  sampleImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StudentPayload = Pick<
  Student,
  'personCode' | 'fullName' | 'location' | 'userId' | 'description' | 'isActive'
>;

/** Bảng person_face_embeddings */
export interface FaceEmbedding {
  id: number;
  personId: number;
  modelName: string;
  modelVersion: string;
  embeddingJson?: string;
  sampleImageUrl?: string;
  createdAt: string;
}