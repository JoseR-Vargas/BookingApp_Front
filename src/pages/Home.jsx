import { useState } from 'react';
import BookingModal from '../components/booking/BookingModal.jsx';
import ContactSection from '../components/home/ContactSection.jsx';
import Footer from '../components/home/Footer.jsx';
import Hero from '../components/home/Hero.jsx';
import ServicesSection from '../components/home/ServicesSection.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import { BookingProvider } from '../state/bookingState.jsx';

// Public landing page. Every "Reservar Cita" button opens the booking flow.
export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = () => setBookingOpen(true);

  return (
    <BookingProvider>
      <Navbar onReserve={openBooking} />
      <main>
        <Hero onReserve={openBooking} />
        <ServicesSection onReserve={openBooking} />
        <ContactSection onReserve={openBooking} />
      </main>
      <Footer />
      {/* Also renders the loading and confirmation dialogs the booking flow drives. */}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </BookingProvider>
  );
}
