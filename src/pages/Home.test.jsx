import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Hero from '../components/home/Hero.jsx';
import ServicesSection from '../components/home/ServicesSection.jsx';
import ContactSection from '../components/home/ContactSection.jsx';

describe('Home reserve CTAs', () => {
  // Each section receives `onReserve`; Home wires every one of them to the same handler.
  const ctas = [
    ['Navbar', Navbar, 'Reservar Cita'],
    ['Hero', Hero, 'Reservar Cita'],
    ['ServicesSection', ServicesSection, 'Reservar Cita Ahora'],
    ['ContactSection', ContactSection, 'Reservar Cita'],
  ];

  it.each(ctas)('%s button calls onReserve once per click', async (_name, Component, label) => {
    const onReserve = vi.fn();
    render(<Component onReserve={onReserve} />);

    await userEvent.click(screen.getByRole('button', { name: label }));

    expect(onReserve).toHaveBeenCalledTimes(1);
  });

  it('renders four reserve buttons on the page (navbar, hero, services, contact)', () => {
    render(<Home />);

    expect(screen.getAllByRole('button', { name: /^Reservar Cita( Ahora)?$/ })).toHaveLength(4);
  });
});

describe('Home booking modal', () => {
  const dialog = () => screen.queryByRole('dialog', { name: 'Reservar tu Cita' });

  it('mounts closed: no booking dialog until a reserve button is pressed', () => {
    render(<Home />);

    expect(dialog()).not.toBeInTheDocument();
  });

  it.each([
    ['Navbar / Hero / Contact', 'Reservar Cita'],
    ['Services', 'Reservar Cita Ahora'],
  ])('%s CTA opens the booking dialog at step 1', async (_where, label) => {
    render(<Home />);

    await userEvent.click(screen.getAllByRole('button', { name: label })[0]);

    expect(await screen.findByRole('dialog', { name: 'Reservar tu Cita' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elige tu Servicio' })).toBeInTheDocument();
  });

  it('can be dismissed with Escape and reopened from the page', async () => {
    render(<Home />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Reservar Cita' })[0]);
    await screen.findByRole('dialog', { name: 'Reservar tu Cita' });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());

    await userEvent.click(screen.getAllByRole('button', { name: 'Reservar Cita' })[0]);
    expect(await screen.findByRole('dialog', { name: 'Reservar tu Cita' })).toBeInTheDocument();
  });
});

describe('Home navigation', () => {
  const anchors = [
    ['Inicio', '#inicio'],
    ['Servicios', '#servicios'],
    ['Contacto', '#contacto'],
  ];

  it('main nav links point to the in-page sections', () => {
    render(<Home />);
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });

    for (const [label, href] of anchors) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });

  it('footer nav links point to the same sections', () => {
    render(<Home />);
    const nav = screen.getByRole('navigation', { name: 'Navegación del pie de página' });

    for (const [label, href] of anchors) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });

  it('every anchor target exists in the page', () => {
    const { container } = render(<Home />);

    for (const [, href] of anchors) {
      expect(container.querySelector(href)).toBeInTheDocument();
    }
    expect(container.querySelector('#inicio').tagName).toBe('SECTION');
  });

  it('exposes landmarks: banner, main and contentinfo', () => {
    render(<Home />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});

describe('Navbar mobile menu', () => {
  const setup = () => {
    render(<Navbar onReserve={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
    const menu = document.getElementById(toggle.getAttribute('aria-controls'));
    return { toggle, menu };
  };

  it('starts collapsed and links the toggle to the menu through aria-controls', () => {
    const { toggle, menu } = setup();

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveClass('hidden');
    expect(menu).toContainElement(screen.getByRole('link', { name: 'Servicios' }));
  });

  it('toggles aria-expanded and the menu visibility on each click', async () => {
    const { toggle, menu } = setup();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(menu).not.toHaveClass('hidden');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveClass('hidden');
  });

  it('closes after a nav link is clicked', async () => {
    const { toggle, menu } = setup();

    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('link', { name: 'Contacto' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveClass('hidden');
  });
});

describe('Home copy', () => {
  it('keeps the hero heading and subcopy', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Tu tiempo,\s*nuestra\s*prioridad/,
    );
    expect(screen.getByText('Reservas Online')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Conocer Más' })).toHaveAttribute('href', '#servicios');
  });

  it('keeps the three service cards', () => {
    render(<Home />);

    for (const title of ['Consultoría', 'Servicios Estándar', 'Premium']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(
      screen.getByRole('heading', { name: 'Profesionales a tu servicio' }),
    ).toBeInTheDocument();
  });

  it('keeps the contact cards and opening hours', () => {
    render(<Home />);

    for (const label of ['Dirección', 'Teléfono', 'Horario']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Av. Demo 1234, Ciudad Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('Lun – Vie: 9:00 – 19:00')).toBeInTheDocument();
    expect(screen.getByText('Sáb: 9:00 – 15:00')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Horarios de Atención' })).toBeInTheDocument();
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('keeps the footer text and social links', () => {
    render(<Home />);
    const footer = screen.getByRole('contentinfo');

    expect(within(footer).getByText('Tu tiempo, nuestra prioridad.')).toBeInTheDocument();
    expect(
      within(footer).getByText('© 2024 BookingApp. Todos los derechos reservados.'),
    ).toBeInTheDocument();
    for (const name of ['Facebook', 'Instagram', 'WhatsApp']) {
      expect(within(footer).getByRole('link', { name })).toBeInTheDocument();
    }
  });
});

describe('Styling guard', () => {
  it('does not leak legacy framework class names into the markup', () => {
    const { container } = render(<Home />);
    const html = container.innerHTML;

    expect(html).not.toMatch(
      /\b(col-(?:md|lg|sm)-\d+|col-12|d-flex|justify-content-center|justify-content-between|navbar-expand-lg|navbar-toggler|navbar-collapse|container-fluid|btn-primary|me-2|ms-auto)\b/,
    );
    // Classes that exist only as legacy framework / legacy stylesheet component names.
    const legacyClass = /(^|\s)(navbar|row|btn|nav-link|nav-item|hero-[\w-]+|service-deco-[\w-]+)(\s|$)/;
    for (const el of container.querySelectorAll('[class]')) {
      expect(el.getAttribute('class')).not.toMatch(legacyClass);
    }
  });
});
