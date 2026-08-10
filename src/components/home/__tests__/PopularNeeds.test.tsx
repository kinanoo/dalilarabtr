import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PopularNeeds from '@/components/home/PopularNeeds';

describe('PopularNeeds', () => {
  it('surfaces the three highest-demand destinations directly', () => {
    render(<PopularNeeds />);

    expect(screen.getByRole('link', { name: /المناطق وتثبيت النفوس/ })).toHaveAttribute('href', '/zones');
    expect(screen.getByRole('link', { name: /التحقق من قيد الكملك/ })).toHaveAttribute('href', '/tools/kimlik-check');
    expect(screen.getByRole('link', { name: /أقرب صيدلية مناوبة/ })).toHaveAttribute('href', '/tools/pharmacy');
  });

  it('opens one compact topic panel with live destinations', () => {
    render(<PopularNeeds />);

    fireEvent.click(screen.getByRole('button', { name: /القنصلية والجواز/ }));
    const panel = document.querySelector('#popular-needs-panel');
    expect(panel).toBeInTheDocument();
    expect(within(panel as HTMLElement).getAllByRole('link')).toHaveLength(3);
    expect(within(panel as HTMLElement).getByRole('link', { name: /حجز موعد القنصلية السورية/ })).toHaveAttribute(
      'href',
      '/article/syrian-consulate-appointment',
    );
  });
});
