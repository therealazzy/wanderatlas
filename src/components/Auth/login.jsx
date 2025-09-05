import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { UserAuth } from '../../context/AuthContext';
import { Loader2Icon } from "lucide-react";
import Header from '../ui/header';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { session, login } = UserAuth();
  const navigate = useNavigate()

  const emailIsValid = /\S+@\S+\.\S+/.test(email)
  const passwordIsValid = password.length >= 6

  const isButtonDisabled =
    !email ||
    !password ||
    !emailIsValid ||
    !passwordIsValid ||
    loading

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login({ email, password })
      if (result.success) {
        navigate('/profile')
      } else if (result.error) {
        setError(result.error.message || 'An error occurred during login')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (<>
    <Header />
    <div className='min-h-[calc(100vh-56px)] h-14 bg-linear-65 from-green-500 to-yellow-200 to-95% flex items-center justify-center'>
      <div className='w-full backdrop-grayscale bg-gradient-to-r from-green-500/90 to-yellow-200/90 pb-16'>
        <form onSubmit={handleLogin} className='w-full max-w-lg mx-auto pt-24 px-4 sm:px-6'>
          <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 mb-4 text-center'>Log in</h1>
          <p className='text-lg sm:text-xl text-gray-600 text-center mb-6'>
            Don&apos;t have an account?{' '}
              <Link to='/signup' className='hover:cursor-pointer font-bold underline'>
                Sign up!
              </Link>
          </p>
          <div className='flex flex-col py-4 space-y-6'>
            <div className='flex flex-col'>
              <input
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                value={email}
                placeholder='Email'
                className='w-full p-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                type='email'
              />
              {!emailIsValid && emailTouched && (
                <p className='text-red-500 text-sm mt-1'>Please enter a valid email</p>
              )}
            </div>

            <div className='flex flex-col'>
              <input
                onChange={(e) => setPass(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                onKeyDown={(e) => e.key === 'Enter' && !isButtonDisabled && handleLogin(e)}
                value={password}
                placeholder='Password'
                className='w-full p-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                type='password'
              />
              {!passwordIsValid && passwordTouched && (
                <p className='text-red-500 text-sm mt-1'>
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isButtonDisabled}
              className="mt-6 w-full flex items-center justify-center p-4 text-base font-semibold rounded-lg"
            >
              {loading && <Loader2Icon className="animate-spin mr-2 h-5 w-5" />}
              {loading ? "Logging in..." : "Log in"}
            </Button>

            {error && <p className='text-red-500 text-center pt-4 text-sm'>{error}</p>}
  
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default Login