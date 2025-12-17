import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ThemeToggle';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('ThemeToggle Component', () => {
  it('renders without crashing', () => {
    render(<ThemeToggle />);
    // يجب أن يكون هناك زر في الشاشة
    const button = screen.getByRole('button', { name: /تبديل الوضع المظلم/i });
    expect(button).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'تبديل الوضع المظلم');
  });
});
