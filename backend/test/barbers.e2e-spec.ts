import {
  bearer,
  createAdmin,
  createBarber,
  login,
  PASSWORD,
  uniqueIp,
} from './utils/factories.js';
import {
  createTestApp,
  resetDatabase,
  type TestApp,
} from './utils/test-app.js';

describe('Cadastro de barbeiros', () => {
  let t: TestApp;
  let adminToken: string;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    await createAdmin(t.prisma);
    adminToken = await login(t.app, 'admin@test.local');
  });

  const newBarber = {
    name: 'Lagertha',
    email: 'lagertha@test.local',
    password: 'escudo-forte-1',
  };

  it('admin cadastra um barbeiro que já consegue entrar', async () => {
    const created = await t
      .http()
      .post('/barbers')
      .set(bearer(adminToken))
      .send(newBarber)
      .expect(201);

    expect(created.body).toEqual({
      id: expect.any(String),
      name: 'Lagertha',
      email: 'lagertha@test.local',
      active: true,
      createdAt: expect.any(String),
    });

    const token = await login(t.app, newBarber.email, newBarber.password);
    const me = await t.http().get('/auth/me').set(bearer(token)).expect(200);
    expect(me.body).toMatchObject({
      role: 'BARBER',
      barberId: created.body.id,
    });
  });

  it('barbeiro e visitante não cadastram nem listam barbeiros', async () => {
    const { user } = await createBarber(t.prisma, 'Ragnar');
    const barberToken = await login(t.app, user.email);

    await t
      .http()
      .post('/barbers')
      .set(bearer(barberToken))
      .send(newBarber)
      .expect(403);
    await t.http().get('/barbers').set(bearer(barberToken)).expect(403);
    await t.http().post('/barbers').send(newBarber).expect(401);
  });

  it('recusa e-mail que já está em uso', async () => {
    await t.http().post('/barbers').set(bearer(adminToken)).send(newBarber);
    const duplicated = await t
      .http()
      .post('/barbers')
      .set(bearer(adminToken))
      .send({ ...newBarber, email: 'LAGERTHA@test.local' })
      .expect(409);
    expect(duplicated.body.message).toBe(
      'Já existe um usuário com este e-mail.',
    );
  });

  it('recusa campos que não existem, como tentar se cadastrar como admin', async () => {
    await t
      .http()
      .post('/barbers')
      .set(bearer(adminToken))
      .send({ ...newBarber, role: 'ADMIN' })
      .expect(400);
  });

  it('desativar um barbeiro derruba as sessões e bloqueia o login', async () => {
    const { user, barber } = await createBarber(t.prisma, 'Ragnar');
    const barberToken = await login(t.app, user.email);

    const updated = await t
      .http()
      .patch(`/barbers/${barber.id}`)
      .set(bearer(adminToken))
      .send({ active: false })
      .expect(200);
    expect(updated.body.active).toBe(false);

    await t.http().get('/auth/me').set(bearer(barberToken)).expect(401);
    await t
      .http()
      .post('/auth/login')
      .set('X-Forwarded-For', uniqueIp())
      .send({ email: user.email, password: PASSWORD })
      .expect(401);

    await t
      .http()
      .patch(`/barbers/${barber.id}`)
      .set(bearer(adminToken))
      .send({ active: true })
      .expect(200);
    await login(t.app, user.email);
  });

  it('admin redefine a senha do barbeiro', async () => {
    const { user, barber } = await createBarber(t.prisma, 'Ragnar');
    const oldToken = await login(t.app, user.email);

    await t
      .http()
      .put(`/barbers/${barber.id}/password`)
      .set(bearer(adminToken))
      .send({ password: 'machado-novo-9' })
      .expect(204);

    await t.http().get('/auth/me').set(bearer(oldToken)).expect(401);
    await login(t.app, user.email, 'machado-novo-9');
  });

  it('valida o id da URL e avisa quando o barbeiro não existe', async () => {
    await t
      .http()
      .patch('/barbers/123')
      .set(bearer(adminToken))
      .send({ name: 'Floki' })
      .expect(400);
    await t
      .http()
      .patch('/barbers/01a12140-4ac9-75d9-97df-06f04c988603')
      .set(bearer(adminToken))
      .send({ name: 'Floki' })
      .expect(404);
  });
});
