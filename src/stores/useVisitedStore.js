import { create } from "zustand";
import { supabase } from "../services/supabaseClient";

export const useVisitedStore = create((set, get) => ({
  visited: [], // [{ country_id, visited_date }]
  loading: false,
  error: null,

  loadVisited: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("user_countries")
      .select("country_id, visited_date")
      .eq("user_id", userId)
      .eq("status", "visited")
      .order("visited_date", { ascending: false });
    if (error) return set({ loading: false, error: error.message });
    set({ visited: data || [], loading: false });
  },

  markVisited: async (userId, countryId, visitedDate = null) => {
    if (!userId || !countryId) return;
    const { error } = await supabase
      .from("user_countries")
      .upsert(
        { user_id: userId, country_id: countryId, status: "visited", visited_date: visitedDate },
        { onConflict: "user_id,country_id" }
      );
    if (error) throw error;
    const current = get().visited;
    if (!current.find((c) => c.country_id === countryId)) {
      set({ visited: [{ country_id: countryId, visited_date: visitedDate }, ...current] });
    }
  },

  unmarkVisited: async (userId, countryId) => {
    if (!userId || !countryId) return;
    const { error } = await supabase
      .from("user_countries")
      .update({ status: "planning", visited_date: null })
      .eq("user_id", userId)
      .eq("country_id", countryId);
    if (error) throw error;
    set({ visited: get().visited.filter((c) => c.country_id !== countryId) });
  }
})); 