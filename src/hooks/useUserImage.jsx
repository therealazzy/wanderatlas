import { supabase } from '../services/supabaseClient';
import { useEffect, useState } from 'react';

export const useCurrentUserImage = () => {
  const [image, setImage] = useState(null); // removed TS type annotation

  useEffect(() => {
    const fetchUserImage = async () => {
      const { data, error } = await supabase().auth.getSession();
      if (error) {
        console.error(error);
      }

      setImage(data.session?.user?.user_metadata?.avatar_url ?? null);
    };

    fetchUserImage();
  }, []);

  return image;
};