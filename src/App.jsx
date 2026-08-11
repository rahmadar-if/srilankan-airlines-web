import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BookingWidget from './components/BookingWidget';
import FavouriteDestinations from './components/FavouriteDestinations';
import ValueServices from './components/ValueServices';
import LatestOffers from './components/LatestOffers';
import ExploreSriLanka from './components/ExploreSriLanka';
import Footer from './components/Footer';
import TrackerProvider from './components/TrackerProvider';
import CookieBanner from './components/CookieBanner';

export default function App() {
  return (
    <TrackerProvider>
      <div className="srilankan-app">
        <Navbar />
        <Hero />
        <BookingWidget />
        <FavouriteDestinations />
        <ValueServices />
        <LatestOffers />
        <ExploreSriLanka />
        <Footer />
        <CookieBanner />
      </div>
    </TrackerProvider>
  );
}
