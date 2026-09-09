export type Coords = {
  latitude: number;
  longitude: number;
};

export type Note = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  content: string;
  created_at: string;
  first_read_at: string | null;
  echo_count: number;
  is_dormant: boolean;
};

export type NearbyNote = Note & {
  distanceMeters: number;
  expiresAt: string | null;
  isExpired: boolean;
};

export type UserProfile = {
  id: string;
  pages: number;
  pages_updated_at: string;
  created_at: string;
};

export type AuthSession = {
  userId: string;
  isAnonymous: boolean;
};