import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import { supabase } from './services/supabaseClient'
import { useNavigate } from "react-router-dom"
import { UserAuth } from './context/AuthContext'

function App() {
  const [countries, setCountries] = useState([])
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountries = async () => {
      const{ data, error } = await supabase.from('countries').select()
      if(error) console.log(error)
      else console.log('success!!')
    }
    fetchCountries()
  },[])

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen h-14 bg-linear-65 from-cyan-300 to-blue-600 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          🌍 Wanderlog Atlas
        </h1>
        <p className="text-xl text-gray-600">
          Track your travels, collect memories
        </p>
        <div className="mt-8 space-x-4">
          {session ? (
            <>
              <Button onClick={() => navigate('/profile')}>
                Profile
              </Button>
              <Button onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App