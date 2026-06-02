import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

interface Category {
  id: number;
  icon: string;
  title: string;
  skills: string;
}

interface Freelancer {
  id: number;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  rate: number;
  skills: string[];
  avatarBg: string;
}

const categories: Category[] = [
  { id: 1, icon: '🎨', title: 'Design & Creative', skills: '2,400+ skills' },
  { id: 2, icon: '💻', title: 'Development & IT', skills: '3,800+ skills' },
  { id: 3, icon: '✍️', title: 'Writing & Translation', skills: '1,600+ skills' },
  { id: 4, icon: '📊', title: 'Sales & Marketing', skills: '1,200+ skills' },
  { id: 5, icon: '📱', title: 'Mobile Development', skills: '900+ skills' },
  { id: 6, icon: '🤖', title: 'AI & Machine Learning', skills: '750+ skills' },
  { id: 7, icon: '🎬', title: 'Video & Animation', skills: '680+ skills' },
  { id: 8, icon: '📐', title: 'Architecture', skills: '420+ skills' },
];

const freelancers: Freelancer[] = [
  {
    id: 1,
    name: 'Ashan Kumara',
    title: 'Full Stack Developer',
    rating: 5,
    reviews: 142,
    rate: 45,
    skills: ['React', 'Node.js', 'MongoDB'],
    avatarBg: '#14a800',
  },
  {
    id: 2,
    name: 'Saman Perera',
    title: 'UI/UX Designer',
    rating: 5,
    reviews: 98,
    rate: 55,
    skills: ['Figma', 'Prototyping'],
    avatarBg: '#7c3aed',
  },
  {
    id: 3,
    name: 'Nadeesha Fernando',
    title: 'Mobile Developer',
    rating: 4,
    reviews: 67,
    rate: 40,
    skills: ['Flutter', 'Firebase'],
    avatarBg: '#dc2626',
  },
  {
    id: 4,
    name: 'Ruwani Jayaweera',
    title: 'Content Writer',
    rating: 5,
    reviews: 203,
    rate: 30,
    skills: ['SEO', 'Copywriting'],
    avatarBg: '#d97706',
  },
];

const popularTags = ['Web Design', 'React Developer', 'UI/UX Design', 'Node.js', 'WordPress'];

const FreelancerPlatform: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    alert(`Searching for "${searchQuery}" — feature coming soon!`);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const renderStars = (rating: number) => {
    const fullStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    return fullStars + emptyStars;
  };

  return (
    <>
      {/* Navbar - Responsive: wraps on mobile, scrolls if needed */}
      <nav className="flex flex-wrap items-center gap-4 px-4 sm:px-6 lg:px-10 py-3 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="text-2xl font-bold text-green-600 tracking-tight">
          freelance<span className="text-gray-900">fluxo</span>
        </div>

        {/* Navigation links - wrap on small screens */}
        <div className="hidden md:flex flex-wrap gap-1.5 flex-1 min-w-50">
          <button className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
            Find talent
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
            Find work
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
            Why us
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
            Enterprise
          </button>
        </div>

        {/* Auth buttons - wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-100"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
          <button
            className="px-4 py-2 border-2 border-green-600 bg-transparent text-green-600 rounded-full text-sm font-medium hover:bg-green-50 transition-all"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
          <button className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
            Post a job
          </button>
        </div>
      </nav>

      {/* Hero Section - responsive padding & text */}
      <section className="bg-[#001e00] py-12 sm:py-16 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-[#0d3b00] to-transparent opacity-80 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight max-w-xl mb-6 sm:mb-7">
            How work<br />should <em className="text-green-600 not-italic">work.</em>
          </h1>

          {/* Search bar - stack on mobile, row on tablet+ */}
          <div className="flex flex-col sm:flex-row bg-white rounded-md overflow-hidden max-w-md sm:max-w-lg lg:max-w-xl shadow-lg">
            <input
              type="text"
              placeholder="Search for any skill or service..."
              className="flex-1 border-none outline-none px-4 py-3.5 text-base text-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors sm:rounded-none rounded-md"
            >
              Search
            </button>
          </div>

          {/* Popular tags - wrap */}
          <div className="flex gap-2 flex-wrap items-center mt-4">
            <span className="text-sm text-gray-400">Popular:</span>
            {popularTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 border border-white/25 rounded-full text-xs sm:text-sm text-gray-200 bg-white/10 cursor-pointer hover:border-green-600 hover:text-green-600 transition-all"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by - responsive wrap */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 py-4 sm:py-5 px-4 sm:px-6 lg:px-10 border-b border-gray-200">
        <span className="text-sm text-gray-500 font-medium">Trusted by</span>
        <div className="flex flex-wrap gap-5 sm:gap-7 items-center">
          <span className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight">Microsoft</span>
          <span className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight">Airbnb</span>
          <span className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight">Bisler</span>
          <span className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight">GE</span>
          <span className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight">Nasdaq</span>
          <span className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight">Automatic</span>
        </div>
      </div>

      {/* Categories Section - responsive grid already good, adjust padding */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            Browse categories
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Explore talent by category</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-lg">
            Find skilled professionals across every field, ready to help your business grow.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-gray-50 rounded-xl p-4 sm:p-6 cursor-pointer border-2 border-transparent hover:border-green-600 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all"
                onClick={() => alert(`Browse ${cat.title} category`)}
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{cat.icon}</div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5 sm:mb-1">{cat.title}</h3>
                <span className="text-[11px] sm:text-xs text-gray-500">{cat.skills}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Freelancers Section - responsive grid */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            Top freelancers
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Work with the best talent</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-lg">
            Handpicked professionals with verified skills and top-rated reviews.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {freelancers.map((fl) => (
              <div
                key={fl.id}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 cursor-pointer hover:border-green-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
                onClick={() => alert(`View profile of ${fl.name}`)}
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold text-white mb-3"
                  style={{ background: fl.avatarBg }}
                >
                  {getInitials(fl.name)}
                </div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5">{fl.name}</div>
                <div className="text-xs sm:text-sm text-gray-500 mb-2">{fl.title}</div>
                <div className="text-amber-500 text-xs sm:text-sm mb-1.5">
                  {renderStars(fl.rating)}{' '}
                  <span className="text-gray-500 text-xs">({fl.reviews})</span>
                </div>
                <div className="font-semibold text-gray-800 text-sm sm:text-base">${fl.rate}/hr</div>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {fl.skills.map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - responsive */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-2">Get started in minutes</h2>
          <p className="text-sm sm:text-base text-gray-500 text-center max-w-md mx-auto mb-6 sm:mb-10">
            Three simple steps to find the talent your project needs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 sm:p-8">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-100 text-green-700 text-base sm:text-lg font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Post your job</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Tell us about your project requirements, timeline, and budget in just a few minutes.
              </p>
            </div>
            <div className="text-center p-4 sm:p-8">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-100 text-green-700 text-base sm:text-lg font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Browse proposals</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Review profiles and proposals from top-rated freelancers who match your needs.
              </p>
            </div>
            <div className="text-center p-4 sm:p-8">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-100 text-green-700 text-base sm:text-lg font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Hire & collaborate</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Work securely with built-in tools for messaging, payments, and progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip - responsive stacking */}
      <div className="bg-[#001e00] py-10 sm:py-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white leading-tight text-center sm:text-left">
            Ready to find the <em className="text-green-600 not-italic">perfect</em> freelancer for your project?
          </h2>
          <div className="flex gap-3 flex-wrap justify-center">
            <button className="px-5 sm:px-7 py-2.5 sm:py-3 bg-white text-gray-900 rounded-full text-sm sm:text-base font-semibold hover:opacity-85 transition-opacity">
              Post a job
            </button>
            <button className="px-5 sm:px-7 py-2.5 sm:py-3 bg-transparent text-white border border-white/40 rounded-full text-sm sm:text-base font-semibold hover:border-white transition-colors">
              Find freelancers
            </button>
          </div>
        </div>
      </div>

      {/* Footer - responsive grid */}
      <footer className="bg-gray-50 py-8 sm:py-10 px-4 sm:px-6 lg:px-10 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">For clients</h4>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">How to hire</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Talent marketplace</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Post a job</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Enterprise</a>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">For freelancers</h4>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">How to find work</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Profile best practices</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Connects</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Resources</a>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Resources</h4>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Help center</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Blog</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Community</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Affiliate program</a>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Company</h4>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">About us</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Careers</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Press</a>
              <a className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600">Contact us</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200 text-xs sm:text-sm text-gray-500">
            <span className="text-2xl font-bold text-green-600 tracking-tight">
              freelance<span className="text-gray-900">fluxo</span></span>
            <span>© 2026 Freelancer Platform. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FreelancerPlatform;