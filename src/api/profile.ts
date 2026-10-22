import { api } from './client'

export interface StudentProfile {
  career: string | null
  interests: string[]
  preferredModality: string | null
}

export interface ProfileOptions {
  careers: string[]
  interests: string[]
  modalities: string[]
}

export interface ProfileResponse {
  profile: StudentProfile
  options: ProfileOptions
}

export interface RecommendedOffer {
  offerId: number
  /** Coincidencia de 0 a 100. */
  match: number
  seatsLeft: number
  reasons: string[]
  offer: {
    id: number
    title: string
    modality: string
    seats: number
    periodStart: string
    periodEnd: string
    company: { name: string; sector: string }
  }
}

export interface RecommendationsResponse {
  profileComplete: boolean
  recommendations: RecommendedOffer[]
}

// El perfil y las recomendaciones no son datos sincronizables: requieren red,
// igual que el listado de ofertas.
export function getProfile(): Promise<ProfileResponse> {
  return api<ProfileResponse>('/profile')
}

export function updateProfile(profile: StudentProfile): Promise<StudentProfile> {
  return api<StudentProfile>('/profile', { method: 'PATCH', body: JSON.stringify(profile) })
}

export function getRecommendedOffers(): Promise<RecommendationsResponse> {
  return api<RecommendationsResponse>('/recommendations/offers')
}
