import {
  at,
  bearer,
  createAdmin,
  createBarber,
  createService,
  login,
  nextWeekday,
} from './utils/factories.js';
import {
  createTestApp,
  resetDatabase,
  type TestApp,
} from './utils/test-app.js';

describe('Agenda pública', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  it('mostra os horários ocupados sem expor dados dos clientes', async () => {
    await createAdmin(t.prisma);
    const ragnar = await createBarber(t.prisma, 'Ragnar');
    const bjorn = await createBarber(t.prisma, 'Bjorn');
    const inactive = await createBarber(t.prisma, 'Rollo', { active: false });
    const corte = await createService(t.prisma);
    const adminToken = await login(t.app, 'admin@test.local');
    const date = nextWeekday(3);

    const book = (barberId: string, time: string) =>
      t
        .http()
        .post('/appointments')
        .set(bearer(adminToken))
        .send({
          barberId,
          serviceId: corte.id,
          startsAt: at(date, time),
          clientName: 'Cliente Secreto',
          clientPhone: '11999990000',
          notes: 'Prefere máquina 2',
        })
        .expect(201);

    await book(ragnar.barber.id, '10:00');
    const cancelled = await book(ragnar.barber.id, '11:00');
    await t
      .http()
      .post(`/appointments/${cancelled.body.id}/cancel`)
      .set(bearer(adminToken))
      .expect(200);

    const response = await t
      .http()
      .get('/public/agenda')
      .query({ date })
      .expect(200);

    expect(response.body).toEqual({
      date,
      timeZone: 'America/Sao_Paulo',
      opensAt: '09:00',
      closesAt: '19:00',
      barbers: [
        { id: bjorn.barber.id, name: 'Bjorn', busy: [] },
        {
          id: ragnar.barber.id,
          name: 'Ragnar',
          busy: [{ startsAt: at(date, '10:00'), endsAt: at(date, '10:30') }],
        },
      ],
    });

    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain('Cliente Secreto');
    expect(raw).not.toContain('11999990000');
    expect(raw).not.toContain('máquina');
    expect(raw).not.toContain(inactive.barber.id);
  });

  it('dia fechado volta sem horário de funcionamento', async () => {
    const response = await t
      .http()
      .get('/public/agenda')
      .query({ date: nextWeekday(0) })
      .expect(200);
    expect(response.body).toMatchObject({
      opensAt: null,
      closesAt: null,
      barbers: [],
    });
  });

  it('valida a data', async () => {
    await t
      .http()
      .get('/public/agenda')
      .query({ date: '2026-02-30' })
      .expect(400);
    await t.http().get('/public/agenda').expect(400);
  });

  it('lista só os serviços ativos', async () => {
    await createService(t.prisma, { name: 'Corte' });
    const barba = await createService(t.prisma, {
      name: 'Barba',
      durationMinutes: 20,
    });
    await t.prisma.service.update({
      where: { id: barba.id },
      data: { active: false },
    });

    const response = await t.http().get('/public/services').expect(200);
    expect(
      response.body.map((service: { name: string }) => service.name),
    ).toEqual(['Corte']);
  });

  it('o health check responde sem login', async () => {
    const response = await t.http().get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
