import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <SignUp
          path="/sign-up"
          routing="path"
          appearance={{
            elements: {
              // Card container styling (the white background container)
              card: 'w-full max-w-md bg-white p-8',
              // Header title styling (welcome message)
              headerTitle: 'text-xl font-bold text-center mb-6 text-purple-900',
              // Primary button styling (sign in button)
              formButtonPrimary:
                'w-full bg-purple-900 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-800 transition disabled:opacity-70',
              // Input fields styling
              formFieldInput:
                'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none mb-4',
              // Divider styling
              divider: 'flex items-center my-4',
              // Social button styling is handled automatically, but you can further customize if desired.
            },
            variables: {
              colorPrimary: '#7c3aed', // Matches your purple-900 color
            },
          }}
        />
      </div>
    );
}