/**
 * FaqFilter drives the /faq search by mutating the server-rendered DOM in
 * place (hidden/open on details[data-faq], the per-section "show the rest"
 * expanders, the section blocks and the anchor nav). The browser-pane
 * environment parks streamed content when its tab is hidden, so the
 * behavioural contract is pinned here in jsdom instead.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FaqFilter from '@/components/FaqFilter';

function mountFaqDom() {
  const host = document.createElement('div');
  host.innerHTML = `
    <nav id="faq-nav"></nav>
    <section id="kimlik" data-faq-section>
      <details data-faq id="faq-1">
        <summary><h3>كيف أجدد بيانات الكملك؟</h3></summary>
        <div>عبر موعد رسمي مجاني.</div>
      </details>
      <details data-faq-more>
        <summary>عرض بقية أسئلة الباب</summary>
        <div>
          <details data-faq id="faq-2">
            <summary><h3>هل نقل الكملك ممكن؟</h3></summary>
            <div>بشروط تقبلها المديرية.</div>
          </details>
        </div>
      </details>
    </section>
    <section id="daily" data-faq-section>
      <details data-faq id="faq-3">
        <summary><h3>كيف أسافر بقطتي في الطائرة؟</h3></summary>
        <div>بدفتر لقاحات وحجز مسبق.</div>
      </details>
    </section>`;
  document.body.appendChild(host);
  return host;
}

const q = {
  item: (id: string) => document.getElementById(id) as HTMLDetailsElement,
  wrapper: () => document.querySelector('details[data-faq-more]') as HTMLDetailsElement,
  section: (id: string) => document.getElementById(id) as HTMLElement,
  nav: () => document.getElementById('faq-nav') as HTMLElement,
};

describe('FaqFilter', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = mountFaqDom();
  });

  afterEach(() => {
    host.remove();
  });

  async function search(value: string) {
    fireEvent.change(screen.getByLabelText('بحث في المحتوى'), { target: { value } });
  }

  it('matches inside a collapsed expander: opens the wrapper and the item, hides the rest', async () => {
    render(<FaqFilter total={3} />);
    await search('نقل الكملك');

    // Anchor on a TRANSITIONED state (faq-1 starts visible), then assert the
    // whole shape inside the retry so late debounce ticks cannot race us.
    await waitFor(() => {
      expect(q.item('faq-1').hidden).toBe(true);
      expect(q.item('faq-2').hidden).toBe(false);
      expect(q.item('faq-2').open).toBe(true);
      expect(q.wrapper().open).toBe(true);
      expect(q.item('faq-3').hidden).toBe(true);
      expect(q.section('daily').hidden).toBe(true);
      expect(q.section('kimlik').hidden).toBe(false);
      expect(q.nav().hidden).toBe(true);
    });
  });

  it('hides an expander that holds no match instead of leaving a dangling summary', async () => {
    render(<FaqFilter total={3} />);
    await search('قطتي');

    await waitFor(() => {
      expect(q.section('kimlik').hidden).toBe(true);
      expect(q.item('faq-3').hidden).toBe(false);
      expect(q.item('faq-3').open).toBe(true);
      expect(q.wrapper().hidden).toBe(true);
    });
  });

  it('clearing the query restores everything closed, visible and navigable', async () => {
    render(<FaqFilter total={3} />);
    await search('قطتي');
    await waitFor(() => expect(q.section('kimlik').hidden).toBe(true));

    await search('');
    await waitFor(() => {
      expect(q.section('kimlik').hidden).toBe(false);
      for (const id of ['faq-1', 'faq-2', 'faq-3']) {
        expect(q.item(id).hidden).toBe(false);
        expect(q.item(id).open).toBe(false);
      }
      expect(q.wrapper().open).toBe(false);
      expect(q.wrapper().hidden).toBe(false);
      expect(q.nav().hidden).toBe(false);
    });
  });

  it('normalizes Arabic before matching (bare alif finds hamza: اسافر ↔ أسافر)', async () => {
    render(<FaqFilter total={3} />);
    await search('اسافر');

    await waitFor(() => {
      expect(q.item('faq-1').hidden).toBe(true);
      expect(q.item('faq-3').hidden).toBe(false);
    });
  });
});
