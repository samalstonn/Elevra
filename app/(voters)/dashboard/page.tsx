"use client";
import { useUser } from '@clerk/nextjs';
import { Button } from '../../components/ui/button';
const DashboardPage = () => {
  const { user } = useUser();
  
  const stats = [
    { label: 'Total Contributions', value: '$12,450' },
    { label: 'Candidates Supported', value: '24' },
    { label: 'Local Impact Score', value: '89%' },
  ];

  const actions = [
    { label: 'View Impact', link: '#' },
    { label: 'Donate Again', link: '#' },
    { label: 'Manage Preferences', link: '#' },
  ];

  return (
      <div className="min-h-screen p-6">
        {/* Header Section */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome, {user?.firstName || user?.username || 'User'}! Track your contributions and maximize your impact.
          </p>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 bg-gray-100 border rounded-xl shadow-md flex flex-col items-center justify-center text-center"
            >
              <h2 className="text-4xl font-bold text-purple-600 mb-2">{stat.value}</h2>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Quick Actions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actions.map((action, index) => (
              <a
                key={index}
                href={action.link}
                className="p-6 bg-white border rounded-xl shadow-md text-center hover:bg-gray-100"
              >
                <p className="text-purple-600 font-medium">{action.label}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Recent Contributions Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Recent Contributions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Jane Doe for City Council</h3>
              <p className="text-gray-600 text-sm mb-4">Donated $250 to support Jane&apos;s campaign for better public transportation.</p>
              <Button variant="purple">View Details</Button>
            </div>
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">John Smith for Mayor</h3>
              <p className="text-gray-600 text-sm mb-4">Contributed $500 to help John&apos;s campaign focus on affordable housing initiatives.</p>
              <Button variant="purple">View Details</Button>
            </div>
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Emily Chen for School Board</h3>
              <p className="text-gray-600 text-sm mb-4">Supported with $1,200 to promote Emily&apos;s efforts in improving local education policies.</p>
              <Button variant="purple">View Details</Button>
            </div>
          </div>
        </section>
      </div>
  );
};

export default DashboardPage;