const DashboardPage = () => {
    const stats = [
      { label: 'Total Contributions', value: '$12,450' },
      { label: 'Projects Supported', value: '24' },
      { label: 'Impact Score', value: '89%' },
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
          <p className="text-gray-600">Track your contributions and maximize your impact.</p>
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Contributions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Local Food Drive</h3>
              <p className="text-gray-600 text-sm mb-4">Donated $250 to support community food distribution.</p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">View Details</button>
            </div>
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Clean Water Initiative</h3>
              <p className="text-gray-600 text-sm mb-4">Supported with $500 for clean water projects in rural areas.</p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">View Details</button>
            </div>
            <div className="p-6 bg-gray-100 border rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Education Fund</h3>
              <p className="text-gray-600 text-sm mb-4">Contributed $1,200 to sponsor educational materials.</p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">View Details</button>
            </div>
          </div>
        </section>
      </div>
    );
  };
  
  export default DashboardPage;