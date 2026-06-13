import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    alert(`Searching for "${searchQuery}" — feature coming soon!`);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  const renderStars = (rating: number) =>
    '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          {/* Logo */}
          <div className="text-xl sm:text-2xl font-bold text-green-600 tracking-tight shrink-0">
            freelance<span className="text-gray-900">fluxo</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 mx-4">
            {['Find talent', 'Find work', 'Why us', 'Enterprise'].map((label) => (
              <button
                key={label}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            <button
              className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-full text-sm font-medium hover:bg-green-50 transition-all"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
              Post a job
            </button>
          </div>

          {/* Mobile: Log in + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {/* Hamburger / X icon */}
              {mobileMenuOpen ? (
                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
            {['Find talent', 'Find work', 'Why us', 'Enterprise'].map((label) => (
              <button
                key={label}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                className="flex-1 py-2 border-2 border-green-600 text-green-600 rounded-full text-sm font-medium hover:bg-green-50 transition-all"
                onClick={() => navigate('/signup')}
              >
                Sign up
              </button>
              <button
                className="flex-1 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Post a job
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="bg-[#001e00] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-[#0d3b00] to-transparent opacity-80 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
            How work<br />should <em className="text-green-500 not-italic">work.</em>
          </h1>

          {/* Search bar */}
          <div className="flex flex-col xs:flex-row bg-white rounded-lg overflow-hidden max-w-xl shadow-lg">
            <input
              type="text"
              placeholder="Search for any skill or service..."
              className="flex-1 border-none outline-none px-4 py-3.5 text-sm sm:text-base text-gray-800 min-w-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-5 py-3 sm:py-3.5 bg-green-600 text-white font-semibold text-sm sm:text-base hover:bg-green-700 transition-colors shrink-0"
            >
              Search
            </button>
          </div>

          {/* Popular tags */}
          <div className="flex gap-2 flex-wrap items-center mt-4">
            <span className="text-xs sm:text-sm text-gray-400">Popular:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                className="px-3 py-1 border border-white/25 rounded-full text-xs text-gray-200 bg-white/10 cursor-pointer hover:border-green-500 hover:text-green-400 transition-all"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex items-center gap-5 sm:gap-8 py-4 px-4 sm:px-6 lg:px-10 min-w-max sm:min-w-0 sm:flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Trusted by</span>
          {['Microsoft', 'Airbnb', 'Bisler', 'GE', 'Nasdaq', 'Automatic'].map((brand) => (
            <span key={brand} className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight shrink-0">
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            Browse categories
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Explore talent by category</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-lg">
            Find skilled professionals across every field, ready to help your business grow.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="bg-gray-50 rounded-xl p-4 sm:p-5 text-left border-2 border-transparent hover:border-green-600 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-95"
                onClick={() => alert(`Browse ${cat.title} category`)}
              >
                <div className="text-2xl sm:text-3xl mb-2">{cat.icon}</div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5 leading-snug">{cat.title}</h3>
                <span className="text-[11px] sm:text-xs text-gray-500">{cat.skills}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP FREELANCERS ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            Top freelancers
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Work with the best talent</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-lg">
            Handpicked professionals with verified skills and top-rated reviews.
          </p>
          {/* Mobile: horizontal scroll; sm+: 2-col; lg+: 4-col */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            {freelancers.map((fl) => (
              <button
                key={fl.id}
                className="snap-start shrink-0 w-[72vw] xs:w-64 sm:w-auto bg-white border border-gray-200 rounded-xl p-4 sm:p-5 text-left cursor-pointer hover:border-green-600 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95"
                onClick={() => alert(`View profile of ${fl.name}`)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white mb-3 shrink-0"
                  style={{ background: fl.avatarBg }}
                >
                  {getInitials(fl.name)}
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-0.5">{fl.name}</div>
                <div className="text-xs text-gray-500 mb-2">{fl.title}</div>
                <div className="text-amber-500 text-xs mb-1.5">
                  {renderStars(fl.rating)}{' '}
                  <span className="text-gray-500">({fl.reviews})</span>
                </div>
                <div className="font-semibold text-gray-800 text-sm">${fl.rate}/hr</div>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {fl.skills.map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-2">
            Get started in minutes
          </h2>
          <p className="text-sm sm:text-base text-gray-500 text-center max-w-md mx-auto mb-8 sm:mb-10">
            Three simple steps to find the talent your project needs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                n: '1',
                title: 'Post your job',
                desc: 'Tell us about your project requirements, timeline, and budget in just a few minutes.',
              },
              {
                n: '2',
                title: 'Browse proposals',
                desc: 'Review profiles and proposals from top-rated freelancers who match your needs.',
              },
              {
                n: '3',
                title: 'Hire & collaborate',
                desc: 'Work securely with built-in tools for messaging, payments, and progress tracking.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center p-4 sm:p-6">
                <div className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-700 text-base font-bold flex items-center justify-center sm:mx-auto sm:mb-4">
                  {n}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <div className="bg-[#001e00] py-10 sm:py-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white leading-tight text-center sm:text-left">
            Ready to find the{' '}
            <em className="text-green-500 not-italic">perfect</em> freelancer for your project?
          </h2>
          <div className="flex gap-3 shrink-0">
            <button className="px-5 sm:px-7 py-2.5 sm:py-3 bg-white text-gray-900 rounded-full text-sm sm:text-base font-semibold hover:opacity-85 transition-opacity">
              Post a job
            </button>
            <button className="px-5 sm:px-7 py-2.5 sm:py-3 bg-transparent text-white border border-white/40 rounded-full text-sm sm:text-base font-semibold hover:border-white transition-colors">
              Find freelancers
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-50 py-8 sm:py-10 px-4 sm:px-6 lg:px-10 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                heading: 'For clients',
                links: ['How to hire', 'Talent marketplace', 'Post a job', 'Enterprise'],
              },
              {
                heading: 'For freelancers',
                links: ['How to find work', 'Profile best practices', 'Connects', 'Resources'],
              },
              {
                heading: 'Resources',
                links: ['Help center', 'Blog', 'Community', 'Affiliate program'],
              },
              {
                heading: 'Company',
                links: ['About us', 'Careers', 'Press', 'Contact us'],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">{heading}</h4>
                {links.map((link) => (
                  <a key={link} className="block text-xs sm:text-sm text-gray-500 mb-2 cursor-pointer hover:text-green-600 transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200">
            <span className="text-xl sm:text-2xl font-bold text-green-600 tracking-tight">
              freelance<span className="text-gray-900">fluxo</span>
            </span>
            <span className="text-xs sm:text-sm text-gray-500 text-center">
              © 2026 Freelancer Platform. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FreelancerPlatform;