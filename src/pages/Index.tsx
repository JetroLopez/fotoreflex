import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import PortfolioSection from '@/components/PortfolioSection';
import TestimonialSection from '@/components/TestimonialSection';
import ContactSection from '@/components/ContactSection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <div id="inicio">
          <HeroSection />
        </div>
        <div id="servicios">
          <ServicesSection />
        </div>
        <div id="portfolio">
          <PortfolioSection />
        </div>
        <div id="testimonios">
          <TestimonialSection />
        </div>
        <div id="contacto">
          <ContactSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
