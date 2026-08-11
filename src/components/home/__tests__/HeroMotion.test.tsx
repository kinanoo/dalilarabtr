import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import AnimatedHeroTitle from '@/components/home/AnimatedHeroTitle';
import HeroDiscoveryLinks from '@/components/home/HeroDiscoveryLinks';

const STORED_LINKS = [
  '/codes',
  '/tools/pharmacy',
  '/tools/kimlik-check',
  '/e-devlet-services',
  '/tools/currency',
  '/places',
  '/updates',
  '/articles',
  '/guides',
  '/forms',
  '/services/category/doctors',
  '/services/category/translators',
];

describe('homepage hero motion', () => {
  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });
  });

  it('keeps the complete title available while the visual title animates', () => {
    render(<AnimatedHeroTitle />);

    expect(screen.getByRole('heading', { name: 'دليلك الشامل في تركيا' })).toBeInTheDocument();
  });

  it('reuses the same discovery links throughout the browser session', async () => {
    sessionStorage.setItem('daleel.hero-discovery-links.v2', JSON.stringify(STORED_LINKS));
    const firstRender = render(<HeroDiscoveryLinks />);

    await waitFor(() => expect(screen.getByRole('navigation')).toHaveClass('opacity-100'));
    const firstHrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(firstHrefs).toEqual(STORED_LINKS);

    firstRender.unmount();
    render(<HeroDiscoveryLinks />);
    await waitFor(() => expect(screen.getByRole('navigation')).toHaveClass('opacity-100'));

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(STORED_LINKS);
  });

  it('drops destinations that are already available in the primary actions', async () => {
    sessionStorage.setItem(
      'daleel.hero-discovery-links.v2',
      JSON.stringify(['/consultant', '/services', ...STORED_LINKS]),
    );

    render(<HeroDiscoveryLinks />);
    await waitFor(() => expect(screen.getByRole('navigation')).toHaveClass('opacity-100'));

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toHaveLength(12);
    expect(hrefs).not.toContain('/consultant');
    expect(hrefs).not.toContain('/services');
  });

  it('presents twelve discovery destinations as text links without boxes', async () => {
    sessionStorage.setItem('daleel.hero-discovery-links.v2', JSON.stringify(STORED_LINKS));
    render(<HeroDiscoveryLinks />);

    await waitFor(() => expect(screen.getByRole('navigation')).toHaveClass('opacity-100'));
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(12);
    links.forEach((link) => {
      const classes = link.className.split(/\s+/);
      expect(classes.some((className) => /^(?:bg-|border(?:-|$)|rounded-)/.test(className))).toBe(false);
    });
  });
});
