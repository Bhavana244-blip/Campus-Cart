export interface AppUser {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  department?: string;
  year?: string;
  registration_number?: string;
  avatar_url?: string;
  rating: number;
  total_ratings: number;
  sold_count: number;
  is_active: boolean;
  created_at: string;
  xp: number;
  level: number;
  title?: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  is_sold: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message?: string;
  last_message_at: string;
  buyer_unread_count: number;
  seller_unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
