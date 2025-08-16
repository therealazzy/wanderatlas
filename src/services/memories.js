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