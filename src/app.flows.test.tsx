import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEMO_USER_IDS } from './data/seed';
import { createTestServices, MemoryStorage } from './test/helpers';
import { renderApp } from './test/renderApp';

/**
 * Průchody uživatelským rozhraním. Ověřují chování prototypu včetně
 * simulovaných oprávnění — nejde o test bezpečnosti.
 */

async function servicesAs(userId: string) {
  const services = createTestServices(new MemoryStorage());
  await services.session.signInAs(userId);
  return services;
}

describe('průchody aplikací', () => {
  it('úvodní stránka nabízí hlavní akce a demo označení', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Prostor pro to, co právě řešíš.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Prohlédnout psychology/ })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Chci nabídnout svůj čas/ })[0]).toBeInTheDocument();
    expect(screen.getByText(/Nevkládej osobní ani zdravotní informace/)).toBeInTheDocument();
  });

  it('seznam psychologů lze filtrovat a filtry vymazat', async () => {
    const { user } = renderApp('/psychologove');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Další filtry' }));
    await user.selectOptions(within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Jazyk konzultace' }), 'uk');
    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Marta Šťastná' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ztráta a truchlení' }));
    expect(screen.getByText('Těmto filtrům teď nikdo neodpovídá')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Vymazat filtry' })[0]!);
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('klient projde rezervací až k potvrzovací stránce', async () => {
    const services = await servicesAs(DEMO_USER_IDS.clientB);
    const slot = services.profiles.listBookableSlots('p-hana')[0]!;
    const { user } = renderApp(`/rezervace/p-hana?termin=${slot.id}`, services);

    expect(screen.getByRole('heading', { name: 'Zkontroluj rezervaci' })).toBeInTheDocument();
    expect(screen.getByText(/Nebudeme po tobě chtít diagnózu/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pokračovat k potvrzení' }));

    expect(screen.getByText('Jde o simulaci')).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Potvrdit rezervaci' });
    expect(confirm).toBeDisabled();
    await user.click(screen.getByLabelText('Je mi alespoň 18 let.'));
    await user.click(screen.getByLabelText('Beru na vědomí, že rezervace není akutní pomoc.'));
    await user.dblClick(confirm);

    expect(await screen.findByRole('heading', { name: 'Termín je zarezervovaný' })).toBeInTheDocument();
    const booked = services.store.getState().appointments.filter((a) => a.slotId === slot.id && a.status === 'booked');
    expect(booked).toHaveLength(1);
  });

  it('klient zruší budoucí rezervaci a termín se znovu nabízí', async () => {
    const services = await servicesAs(DEMO_USER_IDS.clientA);
    const { user } = renderApp('/klient/rezervace/a-tereza-next', services);
    await user.click(screen.getByRole('button', { name: 'Zrušit rezervaci' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Ano, zrušit rezervaci' }));
    expect(await screen.findByText(/Tuto rezervaci jsi zrušil/)).toBeInTheDocument();
    const slotId = services.store.getState().appointments.find((a) => a.id === 'a-tereza-next')!.slotId;
    expect(services.profiles.listBookableSlots('p-alzbeta').some((s) => s.id === slotId)).toBe(true);
  });

  it('dialog připojení k hovoru se zavře Escapem a vrátí focus', async () => {
    const services = await servicesAs(DEMO_USER_IDS.clientA);
    const { user } = renderApp('/klient/rezervace/a-tereza-next', services);
    const button = screen.getByRole('button', { name: 'Připojit se ke konzultaci' });
    await user.click(button);
    expect(screen.getByRole('dialog', { name: 'Připojení ke konzultaci (ukázka)' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('klientská část nabídne vstup do demo účtu, pokud uživatel není klient', async () => {
    const services = await servicesAs(DEMO_USER_IDS.psychologistA);
    renderApp('/klient', services);
    expect(screen.getByRole('heading', { name: 'Tahle část je pro demo účet klienta' })).toBeInTheDocument();
    expect(screen.queryByText('Moje konzultace')).not.toBeInTheDocument();
  });

  it('žadatel nevidí správu termínů, po schválení administrací ano', async () => {
    const services = await servicesAs(DEMO_USER_IDS.applicantPending);
    const first = renderApp('/odbornik/terminy', services);
    expect(screen.getByRole('heading', { name: 'Dostupné po schválení přihlášky' })).toBeInTheDocument();
    first.unmount();

    await services.session.signInAs(DEMO_USER_IDS.admin);
    const admin = renderApp('/admin/zadosti/app-katerina', services);
    await admin.user.click(screen.getByRole('button', { name: 'Schválit' }));
    await admin.user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Schválit přihlášku' }));
    expect(await screen.findAllByText('Schválená')).not.toHaveLength(0);
    admin.unmount();

    await services.session.signInAs(DEMO_USER_IDS.applicantPending);
    renderApp('/odbornik/terminy', services);
    expect(screen.getByRole('heading', { name: 'Termíny' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Přidat termín' })).toBeEnabled();
  });

  it('psycholog vidí jen své rezervace a zkrácené jméno klienta', async () => {
    const services = await servicesAs(DEMO_USER_IDS.psychologistA);
    renderApp('/odbornik/konzultace', services);
    expect(screen.getAllByText(/Klient Tereza M\./).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Tereza Malá/)).not.toBeInTheDocument();
  });

  it('obnovení dema vyžaduje potvrzení', async () => {
    const services = await servicesAs(DEMO_USER_IDS.clientA);
    await services.appointments.cancelAsClient('a-tereza-next');
    const { user } = renderApp('/o-prototypu', services);
    await user.click(screen.getAllByRole('button', { name: 'Obnovit demo' })[0]!);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Obnovit demo data' }));
    expect(services.store.getState().appointments.find((a) => a.id === 'a-tereza-next')?.status).toBe('booked');
  });
});
