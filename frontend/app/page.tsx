import Link from 'next/link';
import UnifiedSearch from './components/UnifiedSearch';
import Header from './components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Bar */}
      <Header />


      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-32">
        
        {/* 1. Hero Section & 2. Orientation (Combined for flow) */}
        <div className="max-w-4xl mx-auto text-center mb-20 md:mb-32">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-gray-900 tracking-tight leading-[1.1] mb-8 animate-text-shine select-none">
            Stories That<br className="hidden md:block" /> Bind Us.
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-1">
            {[
              "A digital sanctuary for our shared history.",
              "Here, we preserve the lineage,",
              "cherish the stories,",
              "and celebrate the moments that define who we are."
            ].map((text, i) => (
              <p 
                key={i}
                className="text-lg md:text-xl text-gray-500 font-light leading-relaxed animate-slide-up-fade"
                style={{ animationDelay: `${200 + (i * 150)}ms` }}
              >
                {text}
              </p>
            ))}
          </div>
        </div>

        {/* 3. Guided Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
          
          {/* PRIMARY PATH: Family Tree (Large, Left) */}
          <div className="md:col-span-8">
            <Link href="/family-tree" className="block h-full group outline-none">
              <article className="card-soft-border h-full p-8 md:p-12 flex flex-col justify-between min-h-[400px] bg-gray-50/50 hover:bg-white relative overflow-hidden transition-all duration-700">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                   <svg className="w-64 h-64 text-gray-900 transform rotate-12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="3" />
                      <path d="M12 8v8m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                   </svg>
                </div>
                
                <div className="relative z-10 w-full mt-auto mb-auto">
                  <span className="inline-block py-1 px-3 rounded-full bg-white border border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 shadow-sm">
                    The Archive
                  </span>
                  <h2 className="text-3xl md:text-5xl font-serif text-gray-900 mb-6 group-hover:text-indigo-900 transition-colors duration-500">
                    View the Family Tree
                  </h2>
                  <p className="text-gray-500 text-lg md:text-xl max-w-md font-light leading-relaxed">
                    Trace the lines of descent and discover the roots that connect us all across generations.
                  </p>
                </div>

                <div className="relative z-10 mt-12 flex items-center gap-3 text-indigo-900/40 group-hover:text-indigo-600 font-medium group-hover:translate-x-2 transition-all duration-500">
                  <span className="text-sm uppercase tracking-widest">Explore the graph</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </article>
            </Link>
          </div>

          {/* SECONDARY PATH: Stories (Top Right) */}
          <div className="md:col-span-4">
            <Link href="/stories" className="block h-full group outline-none">
              <article className="card-soft-border h-full p-10 flex flex-col justify-center min-h-[350px] bg-white">
                <div className="mb-8 w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-serif text-gray-900 mb-3 group-hover:text-orange-900 transition-colors">Stories</h3>
                <p className="text-gray-500 text-base leading-relaxed font-light">
                  Reads tales passed down through time.
                </p>
              </article>
            </Link>
          </div>

          {/* SECONDARY PATH: Media (Bottom Left) */}
          <div className="md:col-span-6 md:row-span-1">
            <Link href="/media" className="block h-full group outline-none">
              <article className="card-soft-border h-full p-10 flex flex-col justify-center min-h-[250px] bg-white">
                <div className="mb-6 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">Gallery</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  A visual archive of faces and shared moments.
                </p>
              </article>
            </Link>
          </div>

          {/* SECONDARY PATH: Members/Activity (Bottom Right) */}
          <div className="md:col-span-6 md:row-span-1">
            <Link href="/activity" className="block h-full group outline-none">
              <article className="card-soft-border h-full p-10 flex flex-col justify-center min-h-[250px] bg-white">
                <div className="mb-6 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform duration-500">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                   </svg>
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-2 group-hover:text-green-900 transition-colors">Family Updates</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  See the latest family updates.
                </p>
              </article>
            </Link>
          </div>

        </div>
      </main>

      <footer className="py-12 text-center text-gray-400 text-sm font-light border-t border-gray-50 mt-12">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} We Bhuiyans Family Archive.</p>
            <div className="flex gap-6 text-gray-300">
               <Link href="/privacy" className="hover:text-gray-500 transition-colors">Privacy</Link>
               <Link href="/terms" className="hover:text-gray-500 transition-colors">Terms</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
