import { Database } from '../types/database.types';

export type SponsorRow = Database['public']['Tables']['sponsors']['Row'];
export type SponsorInsert = Database['public']['Tables']['sponsors']['Insert'];
export type SponsorUpdate = Database['public']['Tables']['sponsors']['Update'];