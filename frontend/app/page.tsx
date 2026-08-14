import Link from 'next/link';
import Image from 'next/image';

export default function PatientLandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-electric-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md z-50 shadow-sm border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="w-8 h-8 flex items-center justify-center bg-electric-500 rounded-lg shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-ink-700 tracking-tight">ICH Meds</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-ink-500">
            <Link href="/" className="text-electric-600">Home</Link>
            <Link href="#about" className="hover:text-electric-600 transition-colors">About Us</Link>
            <Link href="#faq" className="hover:text-electric-600 transition-colors">FAQ</Link>
            <Link href="#contact" className="hover:text-electric-600 transition-colors">Contact Us</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[14px] font-semibold text-ink-600 hover:text-electric-600 transition-colors">
              Log In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-electric-500 hover:bg-electric-600 text-white text-[14px] font-semibold rounded-lg shadow-sm transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
          {/* Full width Hospital background */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/hospital_hero.png" 
              alt="Hospital background" 
              fill
              className="object-cover"
              priority
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />
          </div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 mt-10">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight mb-6 drop-shadow-xl">
                Get instant medical attention from your <span className="text-electric-400">comfort</span>
              </h1>
              <p className="text-lg text-slate-300 font-medium mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed drop-shadow-md">
                Connect with top-rated specialists, book appointments easily, and manage your health records in one secure place. Quality ICH Meds is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/dashboard" className="px-8 py-4 bg-electric-600 hover:bg-electric-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto text-center border border-electric-500">
                  Book an Appointment
                </Link>
              </div>
            </div>

            {/* Right Doctor Image over background */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-none mx-auto hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[8px] border-white/10 backdrop-blur-sm z-10 aspect-[4/5] sm:aspect-square lg:aspect-[4/5] transform hover:scale-[1.02] transition-transform duration-500">
                <Image 
                  src="/images/doctor1.png" 
                  alt="Doctor" 
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-8 -left-12 bg-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-2xl z-20 flex items-start gap-4 border border-white/20 max-w-xs animate-float">
                <div className="w-12 h-12 bg-electric-500/20 rounded-xl flex items-center justify-center shrink-0 border border-electric-400/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white leading-tight mb-1 drop-shadow-sm">
                    You can have a special session with our readily available specialists
                  </p>
                  <p className="text-[11px] font-medium text-slate-300">Quality ICH Meds for you and your loved ones</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quotes Section (User Requested) */}
        <section className="bg-ink-800 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <Image src="/images/hospital_hero.png" alt="Hospital Interior" fill className="object-cover" />
            <div className="absolute inset-0 bg-ink-900/80 mix-blend-multiply" />
          </div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-electric-500 mx-auto mb-6 opacity-80"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
            <p className="text-2xl md:text-4xl font-bold leading-relaxed mb-8">
              "The greatest wealth is health. We are committed to providing unparalleled service as the most trusted ICH Meds institution."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-surface-800 rounded-full overflow-hidden relative border-2 border-electric-500">
                <Image src="/images/doctor1.png" alt="Dr. Rambali" fill className="object-cover" />
              </div>
              <div className="text-left">
                <p className="font-bold">Dr. Rambali</p>
                <p className="text-sm text-electric-300">Chief Medical Officer</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section id="about" className="max-w-7xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 w-full relative rounded-3xl overflow-hidden aspect-video md:aspect-square lg:aspect-video shadow-xl border border-surface-200 bg-surface-100">
             <Image src="/images/hospital_hero.png" alt="Hospital Vision" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-electric-600 mb-8 tracking-tight">Vision</h2>
            <div className="space-y-6">
              {[
                "To provide quality medication and an unparalleled service as the most trusted telemedical and telepharmaceutical ICH Meds institution.",
                "To connect patients with specialists seamlessly through innovative technology and compassionate care.",
                "To build a future where geographic barriers do not limit access to world-class ICH Meds."
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-electric-100 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-electric-600 rounded-full" />
                  </div>
                  <p className="text-[15px] font-medium text-ink-500 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="bg-surface-50 border-y border-surface-200 py-16 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-lg font-bold text-electric-600 mb-10 tracking-wider uppercase">Our Partners</h2>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-2xl font-black font-serif">hp</span>
              <span className="text-2xl font-black font-sans tracking-tighter">intel</span>
              <span className="text-2xl font-black italic">envoy</span>
              <span className="text-2xl font-black font-serif">GASIN</span>
              <span className="text-2xl font-black">SPACE</span>
            </div>
          </div>
        </section>

        {/* Meet our Doctors */}
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-extrabold text-electric-600 mb-16 tracking-tight">Meet our Doctors</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Dr. Rambali', degree: 'MBBS, MD', specialty: 'General Medicine', img: '/images/doctor1.png' },
              { name: 'Dr. Priya Sharma', degree: 'MBBS, MS', specialty: 'Dermatology', img: '/images/doctor2.png' },
              { name: 'Dr. Arjun Mehta', degree: 'MBBS, DNB', specialty: 'Cardiology', img: '/images/doctor3.png' },
              { name: 'Dr. Sneha Patel', degree: 'MBBS, DGO', specialty: 'Gynecology', img: '/images/doctor4.png' },
            ].map((doc, i) => (
              <div key={i} className="group flex flex-col items-center">
                <div className="w-48 h-48 rounded-full overflow-hidden mb-6 bg-surface-100 relative shadow-lg border-4 border-transparent group-hover:border-electric-200 transition-all duration-300">
                  <Image src={doc.img} alt={doc.name} fill className="object-cover" />
                </div>
                <h3 className="text-lg font-bold text-ink-700 mb-1">{doc.name}</h3>
                <p className="text-[13px] font-medium text-ink-400">{doc.degree}</p>
                <p className="text-[13px] font-semibold text-electric-500 mt-1">{doc.specialty}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-200 py-8 text-center">
        <p className="text-[13px] font-medium text-ink-400">© 2026 ICH Meds Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
