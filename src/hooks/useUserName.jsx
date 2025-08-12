import { supabase } from '../services/supabaseClient';
import { useEffect, useState } from 'react';

export const useCurrentUserName = () => {
  const [name, setName] = useState(null); // removed TS type annotation

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data, error } = await supabase().auth.getSession();
      if (error) {
        console.error(error);
      }

      setName(data.session?.user?.user_metadata?.full_name ?? '?');
    };

    fetchProfileName();
  }, []);

  return name || '?';
};