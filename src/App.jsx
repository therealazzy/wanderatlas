import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import { useCountryStore } from './stores/useCountryStore'
import { useNavigate } from "react-router-dom"
import { UserAuth } from './context/AuthContext'
// import MapView from './components/MapView'
import { ChevronDown, Mouse } from 'lucide-react'
import Header from './components/ui/header'
import Globe3D from './components/Globe3D'

function App() {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const { fetchCountries } = useCountryStore();
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries])

  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition > windowHeight * 0.5) {
        setShowScrollHint(false);
      } else {
        setShowScrollHint(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGlobeClick = () => {
    if (session) {
      navigate('/map');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-linear-65 from-cyan-300 to-blue-600">
      <Header />
      {/* Hero Section (restored) */}
      <div className="min-h-screen h-14 flex items-center justify-center relative">
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

        {/* Scroll Down Animation */}
        {showScrollHint && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center text-white">
              <Mouse className="w-6 h-6 mb-2" />
              <ChevronDown className="w-5 h-5" />
              {/*<span className="text-sm mt-2">Scroll to explore</span>*/}
            </div>
          </div>
        )}
      </div>

      {/* Second Section with clickable 3D globe (no background) */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Globe3D onClick={handleGlobeClick} />
          <p className="mt-6 text-lg md:text-xl text-gray-700">
            Tap the globe to open your map
          </p>
          {!session && (
            <p className="mt-2 text-sm text-gray-500">You’ll be asked to log in first</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App