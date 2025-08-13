import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import { useCountryStore } from './stores/useCountryStore'
import { useNavigate } from "react-router-dom"
import { UserAuth } from './context/AuthContext'
import Globe from './components/Globe'
import { ChevronDown, Mouse } from 'lucide-react'

function App() {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const { fetchCountries } = useCountryStore();
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries])

  // Handle scroll to hide scroll hint when user reaches globe
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Hide scroll hint when user scrolls past the first section
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="min-h-screen h-14 bg-linear-65 from-cyan-300 to-blue-600 flex items-center justify-center relative">
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
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center text-white">
              <Mouse className="w-6 h-6 mb-2" />
              <ChevronDown className="w-5 h-5" />
              <span className="text-sm mt-2">Scroll to explore</span>
            </div>
          </div>
        )}
      </div>

      {/* Globe Section */}
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-purple-900">
        <div className="text-center pt-16 pb-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Explore the World
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Click on countries to discover and track your travels
          </p>
        </div>
        <Globe />
      </div>
    </div>
  )
}

export default App