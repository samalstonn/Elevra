"use client";
import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

// Define user types based on schema
type UserType = 'candidate' | 'vendor';

export default function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [userType, setUserType] = useState<UserType>('vendor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  
  // Form fields based on user type
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  // Candidate specific fields
  const [position, setPosition] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedIn] = useState('');
  const [twitter, setTwitter] = useState('');
  
  // Vendor specific fields
  const [bio, setBio] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Start the sign-up process with Clerk
      if (!signUp) {
        throw new Error('Sign-up session not initialized');
      }
      
      const clerkResponse = await signUp.create({
        emailAddress: email,
        password,
      });
      
      // Send the email verification code
      await clerkResponse.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      
      // After sending the verification, store other form data to be used after verification
      setPendingVerification(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Signup error details:', err);
      
      // Special handling for email taken error
      if (err.message?.includes('email address is taken')) {
        setError(`Email address ${email} appears to be already registered. If you believe this is an error, please try a different email or contact support.`);
      } else {
        setError(err.message || 'Something went wrong');
      }
      
      setIsLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Attempt to verify the email address using the code
      if (!signUp) {
        throw new Error('Sign-up session not initialized');
      }
      
      const clerkResponse = await signUp.attemptEmailAddressVerification({
        code,
      });
      
      if (clerkResponse.status !== 'complete') {
        throw new Error('Email verification failed');
      }
      
      // Set the user session as active
      if (!setActive) {
        throw new Error('setActive not available');
      }
      
      await setActive({ session: clerkResponse.createdSessionId });
      
      // Now that the user is verified with Clerk, save the additional data to our database
      const userData = {
        clerkUserId: clerkResponse.createdUserId,
        name,
        email,
        phone,
        city,
        state,
        // Conditionally add fields based on user type
        ...(userType === 'candidate' 
          ? { 
              position,
              website,
              linkedin,
              twitter 
            } 
          : { 
              bio 
            }
        ),
      };
      
      // Save data to our database through API based on user type
      const endpoint = userType === 'candidate' 
        ? '/api/auth/register-candidate' 
        : '/api/auth/register-vendor';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save user data');
      }
      
      // Redirect based on user type
      router.push(userType === 'candidate' ? '/candidate-dashboard' : '/vendor-dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed');
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-purple-900">Create Your Account</h2>
      
      {!pendingVerification ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <Button
              type="button"
              variant={userType === 'vendor' ? 'purple' : 'outline'}
              className="flex-1"
              onClick={() => setUserType('vendor')}
            >
              Vendor
            </Button>
            <Button
              type="button"
              variant={userType === 'candidate' ? 'purple' : 'outline'}
              className="flex-1"
              onClick={() => setUserType('candidate')}
            >
              Candidate
            </Button>
          </div>
          
          <div id="clerk-captcha"></div>
          
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                required
              />
            </div>
          </div>
          
          {userType === 'candidate' ? (
            <>
              <div>
                <label className="block text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                  placeholder="e.g. Mayor, City Council"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Website (Optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">LinkedIn (Optional)</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Twitter (Optional)</label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-gray-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
                rows={3}
                required
              />
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button
            type="submit"
            variant="purple"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Sign Up'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-center text-gray-700 mb-4">
            We've sent a verification code to your email. Please enter it below.
          </p>
          <div>
            <label className="block text-gray-700 mb-1">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-900 focus:outline-none"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button
            type="submit"
            variant="purple"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
      )}
    </div>
  );
} 