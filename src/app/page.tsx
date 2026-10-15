import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import { CommitteeSection } from "@/components/CommitteeSection";
import { AboutSlideshow } from "@/components/AboutSlideshow";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, HandHeart, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let officeBearers: any[] = [];
  try {
    officeBearers = await prisma.officeBearer.findMany({
      orderBy: [
        { level: "asc" },
        { order: "asc" }
      ]
    });
  } catch (err) {
    console.error("Failed to load office bearers on home page:", err);
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <AnimatedHero />

      {/* About Section */}
      <section id="about" className="py-24 bg-orange-600">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl transform -rotate-2 opacity-50"></div>
              <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-2xl bg-white">
                <AboutSlideshow />
              </div>
            </div>
            <div>
              <h2 className="text-orange-100 font-semibold tracking-wide uppercase mb-3">About Us</h2>
              <h3 className="text-4xl font-bold text-white mb-6">A Legacy of Trust & Innovation</h3>
              <p className="text-orange-50 mb-6 text-lg leading-relaxed">
                Since our inception in 2004, AKITDA has been the backbone of Kerala&apos;s IT ecosystem. What started as a small collective has grown into a powerful voice for IT dealers, addressing challenges and seizing opportunities in a rapidly evolving digital landscape.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-white text-orange-600 flex items-center justify-center mt-1 shrink-0">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <span className="text-white font-medium">Over 2000+ Active Members statewide.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-white text-orange-600 flex items-center justify-center mt-1 shrink-0">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <span className="text-white font-medium">Dedicated Complaint Cell for dispute resolution.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-white text-orange-600 flex items-center justify-center mt-1 shrink-0">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <span className="text-white font-medium">Regular expos, workshops, and training programs.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Initiatives & Partners within About Us */}
          <div className="mt-24 pt-16 border-t border-orange-500/30">
            <div className="text-center mb-12">
              <h2 className="text-orange-100 font-semibold tracking-wide uppercase mb-3">Associations & Initiatives</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white">Our Network & Partners</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* KVVES */}
              <a href="https://kvves.net/" target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-2xl h-full group">
                <div className="bg-orange-700/50 rounded-2xl p-6 border border-orange-500/20 hover:bg-orange-700 transition-colors flex flex-col items-center text-center h-full cursor-pointer">
                  <div className="h-32 w-full flex items-center justify-center mb-6">
                    <img src="/logos/img3.png" alt="KVVES Logo" className="w-full h-full max-h-24 object-contain" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:underline">KVVES</h4>
                  <p className="text-orange-100/80 text-sm leading-relaxed">
                    Kerala Vyapari Vyavasayi Ekopana Samithi (KVVES) is the largest organization of merchants in Kerala, representing trading communities and fostering trade growth.
                  </p>
                </div>
              </a>

              {/* FAIITA */}
              <a href="https://faiita.co.in/" target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-2xl h-full group">
                <div className="bg-orange-700/50 rounded-2xl p-6 border border-orange-500/20 hover:bg-orange-700 transition-colors flex flex-col items-center text-center h-full cursor-pointer">
                  <div className="h-32 w-full flex items-center justify-center mb-6">
                    <img src="/logos/img4.png" alt="FAIITA Logo" className="w-full h-full max-h-24 object-contain" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:underline">FAIITA</h4>
                  <p className="text-orange-100/80 text-sm leading-relaxed">
                    Federation of All India IT Associations is a national federation uniting IT associations across India to address state and national IT industry issues.
                  </p>
                </div>
              </a>

              {/* AKITDCS */}
              <a href="https://akitda.co.in/cooperativesociety.html" target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-2xl h-full group">
                <div className="bg-orange-700/50 rounded-2xl p-6 border border-orange-500/20 hover:bg-orange-700 transition-colors flex flex-col items-center text-center h-full cursor-pointer">
                  <div className="h-32 w-full flex items-center justify-center mb-6">
                    <img src="/logos/img1_transparent.png" alt="AKITDCS Logo" className="w-full h-full max-h-24 object-contain" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:underline">AKITDCS</h4>
                  <p className="text-orange-100/80 text-sm leading-relaxed">
                    AKITDA Co-Operative Society provides financial and welfare support uniquely tailored to the needs of AKITDA members and the IT community.
                  </p>
                </div>
              </a>

              {/* IT Shoppe */}
              <a href="https://itshoppe.in/" target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-2xl h-full group">
                <div className="bg-orange-700/50 rounded-2xl p-6 border border-orange-500/20 hover:bg-orange-700 transition-colors flex flex-col items-center text-center h-full cursor-pointer">
                  <div className="h-32 w-full flex items-center justify-center mb-6">
                    <img src="/logos/img2_trimmed.png" alt="IT Shoppe Logo" className="w-full max-w-[90%] h-full max-h-24 object-contain" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:underline">IT Shoppe</h4>
                  <p className="text-orange-100/80 text-sm leading-relaxed">
                    An exclusive AKITDA initiative to promote verified IT purchases, ensuring authentic products and services for consumers across Kerala.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Committee Section */}
      <CommitteeSection officeBearers={officeBearers as any} />

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-green-700 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-green-200 font-semibold tracking-wide uppercase mb-3">Membership Benefits</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white">Why Join AKITDA?</h3>
            <p className="text-green-100 max-w-2xl mx-auto mt-4 text-base md:text-lg">
              Empowering IT dealers across Kerala with direct business growth, comprehensive legal protection, community welfare, and industry expos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Networking */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 group hover:-translate-y-1">
              <CardContent className="pt-8 p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-white text-green-700 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Networking</h4>
                <p className="text-green-50 text-sm leading-relaxed">
                  Connect with over 1,000+ verified IT dealers and suppliers across Kerala to grow your business network.
                </p>
              </CardContent>
            </Card>

            {/* Protection */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 group hover:-translate-y-1">
              <CardContent className="pt-8 p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-white text-green-700 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Protection</h4>
                <p className="text-green-50 text-sm leading-relaxed">
                  Get official legal support and dispute resolution to safeguard your commercial interests.
                </p>
              </CardContent>
            </Card>

            {/* Welfare */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 group hover:-translate-y-1">
              <CardContent className="pt-8 p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-white text-green-700 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                  <HandHeart className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Welfare</h4>
                <p className="text-green-50 text-sm leading-relaxed">
                  Access emergency financial aid and social security support through initiatives like &quot;Snehasparsham&quot;.
                </p>
              </CardContent>
            </Card>

            {/* Events */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 group hover:-translate-y-1">
              <CardContent className="pt-8 p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-white text-green-700 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Events</h4>
                <p className="text-green-50 text-sm leading-relaxed">
                  Enjoy exclusive entry to IT expos, tech summits, training workshops, and annual family meets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Grow Your Business?</h2>
          <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-10">
            Join the largest network of IT dealers in Kerala. Be part of a community that cares.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-8 text-lg font-bold rounded-full">
              Register Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Map/Contact Section */}
      <section id="contact" className="h-[400px] w-full bg-slate-200 relative">
        <iframe
          src="https://maps.google.com/maps?q=All+Kerala+IT+Dealers+Association,Ernakulam&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="AKITDA Ernakulam Office Location"
        ></iframe>
      </section>

      <Footer />
    </div>
  );
}
