import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import { supabase } from './services/supabaseClient'
import { useNavigate } from "react-router-dom"

function App() {
  const [countries, setCountries] = useState([])

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountries = async () => {
      const{ data, error } = await supabase.from('countries').select()
      if(error) console.log(error)
      else console.log('success!!')
    }
    fetchCountries()
  },[])
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
          <Button onClick={() => navigate('/login')}>
            Log in
          </Button>
          <Button onClick={() => navigate('/signup')}>
            Sign up
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App