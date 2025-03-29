import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Lazy load components
const HeroSection = React.lazy(() => import('@/components/HeroSection'));
const ServicesSection = React.lazy(() => import('@/components/ServicesSection'));
const PortfolioSection = React.lazy(() => import('@/components/PortfolioSection'));
const TestimonialSection = React.lazy(() => import('@/components/TestimonialSection'));
const ContactSection = React.lazy(() => import('@/components/ContactSection'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-studio-brown"></div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <div id="inicio">
          <Suspense fallback={<LoadingFallback />}>
            <HeroSection />
          </Suspense>
        </div>
        <div id="servicios">
          <Suspense fallback={<LoadingFallback />}>
            <ServicesSection />
          </Suspense>
        </div>
        <div id="portfolio">
          <Suspense fallback={<LoadingFallback />}>
            <PortfolioSection />
          </Suspense>
        </div>
        <div id="testimonios">
          <Suspense fallback={<LoadingFallback />}>
            <TestimonialSection />
          </Suspense>
        </div>
        <div id="contacto">
          <Suspense fallback={<LoadingFallback />}>
            <ContactSection />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
