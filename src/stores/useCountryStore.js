import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';


export const useCountryStore = create((set, get) => ({

  countries: [],
  loading: false,
  error: null,
  
  // Test function to check Supabase connection
  testConnection: async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase
        .from('countries')
        .select('count')
        .limit(1);
      
      console.log('Connection test result:', { data, error });
      return { success: !error, data, error };
    } catch (err) {
      console.error('Connection test failed:', err);
      return { success: false, error: err };
    }
  },
  

  fetchCountries: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching countries from database...');
      
      // Try different approaches to get countries data
      let data = null;
      let error = null;
      
      // Approach 1: Try with RLS bypass (if you have service role key)
      try {
        const { data: rlsData, error: rlsError } = await supabase
          .from('countries')
          .select('id, name, code, region')
          .order('name');
        
        if (!rlsError && rlsData && rlsData.length > 0) {
          data = rlsData;
          console.log('Successfully fetched with RLS bypass');
        }
      } catch (e) {
        console.log('RLS bypass failed:', e.message);
      }
      
      // Approach 2: Try with different query structure
      if (!data) {
        try {
          const { data: altData, error: altError } = await supabase
            .from('countries')
            .select('*');
          
          if (!altError && altData && altData.length > 0) {
            data = altData;
            console.log('Successfully fetched with alternative query');
          }
        } catch (e) {
          console.log('Alternative query failed:', e.message);
        }
      }
      
      // Approach 3: Try with service role (if available)
      if (!data) {
        try {
          // This would require service role key in environment
          const { data: serviceData, error: serviceError } = await supabase
            .from('countries')
            .select('id, name, code, region')
            .order('name');
          
          if (!serviceError && serviceData && serviceData.length > 0) {
            data = serviceData;
            console.log('Successfully fetched with service role');
          }
        } catch (e) {
          console.log('Service role query failed:', e.message);
        }
      }
      
      console.log('Final countries data:', data);
      console.log('Countries fetched successfully:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('No countries found in database!');
        set({ countries: [], loading: false, error: 'No countries found in database' });
        return;
      }
      
      set({ countries: data, loading: false });
    } catch (error) {
      console.error('Error fetching countries:', error);
      set({ error: error.message, loading: false, countries: [] });
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