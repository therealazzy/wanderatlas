import { supabase } from "./supabaseClient";

export const addMemory = async ({ userId, country, title, date, notes }) => {
  const { data, error } = await supabase
    .from("memories")
    .insert([{ user_id: userId, country, title, date, notes }]);
  return { data, error };
}; 