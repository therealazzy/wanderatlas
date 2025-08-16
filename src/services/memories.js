import { supabase } from "./supabaseClient";

export const addMemory = async ({ userId, countryId, title, date, notes, location = null, photos = null, rating = null, tags = null, isPublic = false }) => {
  const payload = {
    user_id: userId,
    country_id: countryId,
    title,
    description: notes ?? null,
    memory_date: date ?? null,
    location,
    photos,
    rating,
    tags,
    is_public: isPublic
  };

  const { data, error } = await supabase
    .from("memories")
    .insert([payload])
    .select();
  return { data, error };
};

export const getMemoryCountsByCountry = async (userId) => {
  const { data, error } = await supabase
    .from('memories')
    .select('country_id')
    .eq('user_id', userId);

  if (error) return { data: null, error };

  const counts = {};
  (data || []).forEach((row) => {
    const id = row.country_id;
    if (!id) return;
    counts[id] = (counts[id] || 0) + 1;
  });

  const result = Object.entries(counts).map(([country_id, count]) => ({ country_id, count }));
  return { data: result, error: null };
}; 