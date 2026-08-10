import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PopularNeeds from '@/components/home/PopularNeeds';

describe('PopularNeeds', () => {
  it('surfaces the three highest-demand tools directly', () => {
    render(<PopularNeeds />);

    expect(screen.getByRole('link', { name: /المناطق وتثبيت النفوس/ })).toHaveAttribute('href', '/zones');
    expect(screen.getByRole('link', { name: /فحص قيد الكملك/ })).toHaveAttribute('href', '/tools/kimlik-check');
    expect(screen.getByRole('link', { name: /صيدلية مناوبة الآن/ })).toHaveAttribute('href', '/tools/pharmacy');
  });

  it('opens tools in a dialog instead of expanding the page', () => {
    render(<PopularNeeds />);

    fireEvent.click(screen.getByRole('button', { name: /الهوية والحماية/ }));
    const dialog = screen.getByRole('dialog', { name: /الهوية والحماية/ });

    expect(dialog).toBeInTheDocument();
    expect(document.querySelector('#popular-needs-panel')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /دليل الأكواد الأمنية/ })).toHaveAttribute('href', '/codes');
    expect(within(dialog).getByRole('link', { name: /حاسبة مدة منع الدخول/ })).toHaveAttribute('href', '/ban-calculator');
  });

  it('closes the tool dialog without navigating', () => {
    render(<PopularNeeds />);

    fireEvent.click(screen.getByRole('button', { name: /المال والعمل/ }));
    fireEvent.click(screen.getByRole('button', { name: /إغلاق النافذة/ }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
