import { bearer, createAdmin, createBarber, login } from './utils/factories.js';
import {
  createTestApp,
  resetDatabase,
  type TestApp,
} from './utils/test-app.js';

describe('Serviços e horário de funcionamento', () => {
  let t: TestApp;
  let adminToken: string;
  let barberToken: string;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    await createAdmin(t.prisma);
    const { user } = await createBarber(t.prisma, 'Ragnar');
    adminToken = await login(t.app, 'admin@test.local');
    barberToken = await login(t.app, user.email);
  });

  it('admin cria e edita serviços; barbeiro só consulta', async () => {
    const created = await t
      .http()
      .post('/services')
      .set(bearer(adminToken))
      .send({ name: 'Corte', durationMinutes: 30, priceCents: 4500 })
      .expect(201);
    expect(created.body).toEqual({
      id: expect.any(String),
      name: 'Corte',
      durationMinutes: 30,
      priceCents: 4500,
      active: true,
    });

    await t
      .http()
      .patch(`/services/${created.body.id}`)
      .set(bearer(adminToken))
      .send({ priceCents: 5000, active: false })
      .expect(200);

    await t
      .http()
      .post('/services')
      .set(bearer(barberToken))
      .send({ name: 'Barba', durationMinutes: 20, priceCents: 3000 })
      .expect(403);

    const list = await t
      .http()
      .get('/services')
      .set(bearer(barberToken))
      .expect(200);
    expect(list.body).toEqual([
      expect.objectContaining({
        name: 'Corte',
        priceCents: 5000,
        active: false,
      }),
    ]);
  });

  it('valida duração, preço e nome repetido', async () => {
    await t
      .http()
      .post('/services')
      .set(bearer(adminToken))
      .send({ name: 'Corte', durationMinutes: 32, priceCents: 4500 })
      .expect(400);
    await t
      .http()
      .post('/services')
      .set(bearer(adminToken))
      .send({ name: 'Corte', durationMinutes: 30, priceCents: -1 })
      .expect(400);

    await t
      .http()
      .post('/services')
      .set(bearer(adminToken))
      .send({ name: 'Corte', durationMinutes: 30, priceCents: 4500 })
      .expect(201);
    await t
      .http()
      .post('/services')
      .set(bearer(adminToken))
      .send({ name: 'Corte', durationMinutes: 45, priceCents: 6000 })
      .expect(409);
  });

  it('qualquer pessoa vê o horário de funcionamento', async () => {
    const response = await t.http().get('/business-hours').expect(200);
    expect(response.body).toHaveLength(7);
    expect(response.body[0]).toEqual({
      weekday: 0,
      opensAt: null,
      closesAt: null,
    });
    expect(response.body[1]).toEqual({
      weekday: 1,
      opensAt: '09:00',
      closesAt: '19:00',
    });
  });

  it('só o admin troca o horário, sempre com os 7 dias', async () => {
    const week = [
      { weekday: 0, opensAt: null, closesAt: null },
      { weekday: 1, opensAt: null, closesAt: null },
      { weekday: 2, opensAt: '10:00', closesAt: '20:00' },
      { weekday: 3, opensAt: '10:00', closesAt: '20:00' },
      { weekday: 4, opensAt: '10:00', closesAt: '20:00' },
      { weekday: 5, opensAt: '10:00', closesAt: '22:00' },
      { weekday: 6, opensAt: '08:00', closesAt: '14:00' },
    ];

    await t
      .http()
      .put('/business-hours')
      .set(bearer(barberToken))
      .send(week)
      .expect(403);
    const saved = await t
      .http()
      .put('/business-hours')
      .set(bearer(adminToken))
      .send(week)
      .expect(200);
    expect(saved.body).toEqual(week);

    await t
      .http()
      .put('/business-hours')
      .set(bearer(adminToken))
      .send(week.slice(0, 6))
      .expect(400);
    await t
      .http()
      .put('/business-hours')
      .set(bearer(adminToken))
      .send([
        ...week.slice(0, 6),
        { weekday: 6, opensAt: '18:00', closesAt: '09:00' },
      ])
      .expect(400);
  });
});
