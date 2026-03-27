import { create } from 'zustand';
import { Listing } from '../types/app.types';

interface ListingsStore {
  listings: Listing[];
  myListings: Listing[];
  wishlistedIds: string[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  setListings: (listings: Listing[]) => void;
  setMyListings: (myListings: Listing[]) => void;
  setWishlistedIds: (ids: string[]) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
}

export const useListingsStore = create<ListingsStore>((set) => ({
  listings: [],
  myListings: [],
  wishlistedIds: [],
  isLoading: false,
  hasMore: true,
  page: 0,
  setListings: (listings) => set({ listings }),
  setMyListings: (myListings) => set({ myListings }),
  setWishlistedIds: (wishlistedIds) => set({ wishlistedIds }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),
}));
