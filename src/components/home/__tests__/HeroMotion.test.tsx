import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import AnimatedHeroTitle from '@/components/home/AnimatedHeroTitle';
import HeroDiscoveryLinks from '@/components/home/HeroDiscoveryLinks';

const STORED_LINKS = [
  '/codes',
  '/tools/pharmacy',
  '/services',
  '/e-devlet-services',
  '/tools/currency',
  '/places',
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
    sessionStorage.setItem('daleel.hero-discovery-links.v1', JSON.stringify(STORED_LINKS));
    const firstRender = render(<HeroDiscoveryLinks />);

    await waitFor(() => expect(screen.getByRole('navigation')).toHaveClass('opacity-100'));
    const firstHrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(firstHrefs).toEqual(STORED_LINKS);

    firstRender.unmount();
    render(<HeroDiscoveryLinks />);
    await waitFor(() => expect(screen.getByRole('navigation')).toHaveClass('opacity-100'));

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(STORED_LINKS);
  });
});
