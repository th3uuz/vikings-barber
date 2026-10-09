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

const TUESDAY = 2;
const SUNDAY = 0;

describe('Agendamentos', () => {
  let t: TestApp;
  let adminToken: string;
  let ragnarToken: string;
  let ragnarId: string;
  let bjornId: string;
  let corteId: string;
  let date: string;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    await createAdmin(t.prisma);
    const ragnar = await createBarber(t.prisma, 'Ragnar');
    const bjorn = await createBarber(t.prisma, 'Bjorn');
    const corte = await createService(t.prisma, {
      durationMinutes: 30,
      priceCents: 4500,
    });

    adminToken = await login(t.app, 'admin@test.local');
    ragnarToken = await login(t.app, ragnar.user.email);
    ragnarId = ragnar.barber.id;
    bjornId = bjorn.barber.id;
    corteId = corte.id;
    // Terça-feira: a barbearia abre das 09:00 às 19:00.
    date = nextWeekday(TUESDAY);
  });

  const book = (token: string, body: Record<string, unknown>) =>
    t
      .http()
      .post('/appointments')
      .set(bearer(token))
      .send({ serviceId: corteId, clientName: 'Floki', ...body });

  it('admin agenda para qualquer barbeiro', async () => {
    const response = await book(adminToken, {
      barberId: bjornId,
      startsAt: at(date, '10:00'),
      clientPhone: '(11) 98888-7777',
    }).expect(201);

    expect(response.body).toMatchObject({
      barber: { id: bjornId, name: 'Bjorn' },
      service: { id: corteId, name: 'Corte', durationMinutes: 30 },
      clientName: 'Floki',
      clientPhone: '(11) 98888-7777',
      startsAt: at(date, '10:00'),
      endsAt: at(date, '10:30'),
      priceCents: 4500,
      status: 'SCHEDULED',
    });
  });

  it('barbeiro agenda na própria agenda, mas não na de outro barbeiro', async () => {
    await book(ragnarToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:00'),
    }).expect(201);

    const forbidden = await book(ragnarToken, {
      barberId: bjornId,
      startsAt: at(date, '10:00'),
    }).expect(403);
    expect(forbidden.body.message).toBe(
      'Você só pode mexer na sua própria agenda.',
    );
  });

  it('não deixa dois horários sobrepostos para o mesmo barbeiro', async () => {
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:00'),
    }).expect(201);

    const overlap = await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:15'),
    }).expect(409);
    expect(overlap.body.message).toBe(
      'Esse horário já está ocupado para este barbeiro.',
    );

    // Encostado no anterior pode, e outro barbeiro no mesmo horário também.
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:30'),
    }).expect(201);
    await book(adminToken, {
      barberId: bjornId,
      startsAt: at(date, '10:00'),
    }).expect(201);
  });

  it('mesmo com pedidos simultâneos, só um leva o horário', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        book(adminToken, { barberId: ragnarId, startsAt: at(date, '15:00') }),
      ),
    );

    const statuses = attempts
      .map((response) => response.status)
      .sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(await t.prisma.appointment.count()).toBe(1);
  });

  it('um horário cancelado volta a ficar livre', async () => {
    const first = await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '11:00'),
    }).expect(201);

    const cancelled = await t
      .http()
      .post(`/appointments/${first.body.id}/cancel`)
      .set(bearer(ragnarToken))
      .expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');

    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '11:00'),
    }).expect(201);
  });

  it('respeita o horário de funcionamento', async () => {
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '08:30'),
    }).expect(422);

    // Começa 18:45 e termina 19:15: passa do fechamento.
    const late = await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '18:45'),
    }).expect(422);
    expect(late.body.message).toBe(
      'Fora do horário de funcionamento (09:00 às 19:00).',
    );

    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '18:30'),
    }).expect(201);

    const sunday = await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(nextWeekday(SUNDAY), '10:00'),
    }).expect(422);
    expect(sunday.body.message).toBe('A barbearia não abre neste dia.');
  });

  it('não agenda horário que já passou', async () => {
    const response = await book(adminToken, {
      barberId: ragnarId,
      startsAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    }).expect(422);
    expect(response.body.message).toBe(
      'Não é possível agendar um horário que já passou.',
    );
  });

  it('recusa serviço ou barbeiro inativo', async () => {
    await t.prisma.service.update({
      where: { id: corteId },
      data: { active: false },
    });
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:00'),
    }).expect(422);

    await t.prisma.service.update({
      where: { id: corteId },
      data: { active: true },
    });
    await t.prisma.barber.update({
      where: { id: bjornId },
      data: { active: false },
    });
    await book(adminToken, {
      barberId: bjornId,
      startsAt: at(date, '10:00'),
    }).expect(422);
  });

  it('valida o corpo da requisição', async () => {
    // Sem fuso horário, o horário seria ambíguo.
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: `${date}T10:00:00`,
    }).expect(400);
    await book(adminToken, {
      barberId: 'abc',
      startsAt: at(date, '10:00'),
    }).expect(400);
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:00'),
      status: 'CANCELLED',
    }).expect(400);
  });

  it('barbeiro vê só a própria agenda; admin vê todas', async () => {
    await book(adminToken, {
      barberId: ragnarId,
      startsAt: at(date, '10:00'),
    }).expect(201);
    await book(adminToken, {
      barberId: bjornId,
      startsAt: at(date, '09:00'),
    }).expect(201);

    const own = await t
      .http()
      .get('/appointments')
      .query({ date })
      .set(bearer(ragnarToken))
      .expect(200);
    expect(own.body).toHaveLength(1);
    expect(own.body[0].barber.id).toBe(ragnarId);

    await t
      .http()
      .get('/appointments')
      .query({ date, barberId: bjornId })
      .set(bearer(ragnarToken))
      .expect(403);

    const all = await t
      .http()
      .get('/appointments')
      .query({ date })
      .set(bearer(adminToken))
      .expect(200);
    expect(
      all.body.map((item: { barber: { name: string } }) => item.barber.name),
    ).toEqual(['Bjorn', 'Ragnar']);

    const filtered = await t
      .http()
      .get('/appointments')
      .query({ date, barberId: bjornId })
      .set(bearer(adminToken))
      .expect(200);
    expect(filtered.body).toHaveLength(1);
  });

  it('barbeiro não cancela agendamento de outro barbeiro', async () => {
    const bjornAppointment = await book(adminToken, {
      barberId: bjornId,
      startsAt: at(date, '10:00'),
    }).expect(201);

    await t
      .http()
      .post(`/appointments/${bjornAppointment.body.id}/cancel`)
      .set(bearer(ragnarToken))
      .expect(403);

    await t
      .http()
      .post(`/appointments/${bjornAppointment.body.id}/cancel`)
      .set(bearer(adminToken))
      .expect(200);
    await t
      .http()
      .post(`/appointments/${bjornAppointment.body.id}/cancel`)
      .set(bearer(adminToken))
      .expect(409);
  });
});
