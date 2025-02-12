import { Card, CardContent } from "../../components/Card";
import { Button } from "../../components/ui";
import { Search, Filter, Globe, Users, Handshake, HeartHandshake, BookHeart, HelpingHand } from "lucide-react";

export default function NonprofitResults() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Search Bar */}
      <div className="flex items-center border p-3 rounded-lg shadow-md mb-6">
        <Search className="mr-3" />
        <input
          type="text"
          placeholder="Search for nonprofits, causes, or volunteer opportunities"
          className="w-full border-none outline-none"
        />
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Location
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Volunteer Opportunities
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Donations Needed
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Clean Energy
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Community Programs
        </Button>
      </div>

      {/* Featured Nonprofits */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <Globe size={40} className="mb-3" />
            <h2 className="text-xl font-semibold">Global Environmental Action</h2>
            <p className="text-gray-600">Working towards a greener and more sustainable planet.</p>
            <Button className="mt-3 bg-purple-600 text-white">Support</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Users size={40} className="mb-3" />
            <h2 className="text-xl font-semibold">Local Community Outreach</h2>
            <p className="text-gray-600">Assisting underserved neighborhoods with essential services.</p>
            <Button className="mt-3 bg-purple-600 text-white">Support</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Handshake size={40} className="mb-3" />
            <h2 className="text-xl font-semibold">Social Justice Advocacy</h2>
            <p className="text-gray-600">Promoting equality and human rights initiatives.</p>
            <Button className="mt-3 bg-purple-600 text-white">Support</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <HeartHandshake size={40} className="mb-3" />
            <h2 className="text-xl font-semibold">Disaster Relief Coalition</h2>
            <p className="text-gray-600">Providing emergency aid and support in crisis areas.</p>
            <Button className="mt-3 bg-purple-600 text-white">Support</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <BookHeart size={40} className="mb-3" />
            <h2 className="text-xl font-semibold">Education for All</h2>
            <p className="text-gray-600">Ensuring every child has access to quality education.</p>
            <Button className="mt-3 bg-purple-600 text-white">Support</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <HelpingHand size={40} className="mb-3" />
            <h2 className="text-xl font-semibold">Mental Health Support Network</h2>
            <p className="text-gray-600">Providing mental health resources and counseling.</p>
            <Button className="mt-3 bg-purple-600 text-white">Support</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}