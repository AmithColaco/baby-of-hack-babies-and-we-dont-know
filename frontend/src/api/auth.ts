import apiClient from './client';

export interface OTPResponse {
  message: string;
  phone?: string;
  email?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
  is_new_user: boolean;
}

export interface UserRecord {
  id: string;
  role: 'artisan' | 'buyer' | 'facilitator' | 'admin';
  name: string;
  phone?: string | null;
  email?: string | null;
  language: string;
  created_at: string;
}

export interface ArtisanProfileRecord {
  user_id: string;
  craft_types: string;
  village: string;
  years_practising: number;
  bio: string;
  avatar_url: string;
  verified: boolean;
  created_by?: string;
}

export interface ProfileResponse {
  user: UserRecord;
  artisan_profile?: ArtisanProfileRecord | null;
}

export interface UpdateProfileInput {
  name?: string;
  craft_types?: string;
  village?: string;
  years_practising?: number;
  bio?: string;
  avatar_url?: string;
  role?: string;
}

/** Request an OTP. Pass either phone or email (preferably email). */
export async function requestOtp(
  contact: string,
  type: 'phone' | 'email' = 'phone'
): Promise<OTPResponse> {
  const payload = type === 'email' ? { email: contact } : { phone: contact };
  const { data } = await apiClient.post<OTPResponse>('/auth/otp/request', payload);
  return data;
}

/** Verify OTP. Pass either phone or email, plus otp and optionally role. */
export async function verifyOtp(
  contact: string,
  otp: string,
  type: 'phone' | 'email' = 'phone',
  role?: string
): Promise<TokenResponse> {
  const payload: Record<string, string> = { otp };
  if (type === 'email') payload.email = contact;
  else payload.phone = contact;
  if (role) payload.role = role;
  const { data } = await apiClient.post<TokenResponse>('/auth/otp/verify', payload);
  return data;
}

export async function getMe(): Promise<ProfileResponse> {
  const { data } = await apiClient.get<ProfileResponse>('/me');
  return data;
}

export async function updateMe(input: UpdateProfileInput): Promise<ProfileResponse> {
  const { data } = await apiClient.put<ProfileResponse>('/me', input);
  return data;
}

export async function getArtisans(): Promise<ProfileResponse[]> {
  const { data } = await apiClient.get<ProfileResponse[]>('/artisans');
  return data;
}

export async function getArtisanById(userId: string): Promise<ProfileResponse> {
  const { data } = await apiClient.get<ProfileResponse>(`/auth/artisans/${userId}`);
  return data;
}
