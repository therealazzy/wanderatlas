import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

export const useCountryStore = create((set, get) => ({

  countries: [],
  loading: false,
  error: null,
  

  fetchCountries: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      set({ countries: data, loading: false });
      console.log('Countries fetched successfully:', data.length);
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching countries:', error);
    }
  },
  
  // Helper getters
  getCountriesByRegion: (region) => {
    return get().countries.filter(country => country.region === region);
  },
  
  getCountryByCode: (code) => {
    return get().countries.find(country => country.code === code);
  },
  
  // Reset state
  reset: () => set({ countries: [], loading: false, error: null }),
}));