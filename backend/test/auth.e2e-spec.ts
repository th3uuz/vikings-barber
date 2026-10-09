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

describe('Autenticação', () => {
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

  const tryLogin = (email: string, password: string, ip = uniqueIp()) =>
    t
      .http()
      .post('/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email, password });

  it('faz login e devolve o usuário sem dados sensíveis', async () => {
    await createAdmin(t.prisma);

    const response = await tryLogin('ADMIN@test.local', PASSWORD).expect(200);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: 'Admin',
      email: 'admin@test.local',
      role: 'ADMIN',
      barberId: null,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);

    const me = await t
      .http()
      .get('/auth/me')
      .set(bearer(response.body.token))
      .expect(200);
    expect(me.body.email).toBe('admin@test.local');
  });

  it('guarda só o hash do token no banco', async () => {
    await createAdmin(t.prisma);
    const token = await login(t.app, 'admin@test.local');

    const sessions = await t.prisma.session.findMany();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toBe(token);
    expect(sessions[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('responde igual para e-mail inexistente e senha errada', async () => {
    await createAdmin(t.prisma);

    const wrongPassword = await tryLogin(
      'admin@test.local',
      'errada-123',
    ).expect(401);
    const unknownEmail = await tryLogin(
      'ninguem@test.local',
      'errada-123',
    ).expect(401);

    expect(wrongPassword.body.message).toBe('E-mail ou senha inválidos.');
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('bloqueia o login de usuário desativado', async () => {
    await createAdmin(t.prisma, { active: false });
    await tryLogin('admin@test.local', PASSWORD).expect(401);
  });

  it('exige login nas rotas protegidas', async () => {
    await t.http().get('/auth/me').expect(401);
    await t.http().get('/auth/me').set(bearer('token-inventado')).expect(401);
    await t
      .http()
      .get('/auth/me')
      .set('Authorization', 'Basic YWRtaW46YWRtaW4=')
      .expect(401);
  });

  it('o logout invalida o token', async () => {
    await createAdmin(t.prisma);
    const token = await login(t.app, 'admin@test.local');

    await t.http().post('/auth/logout').set(bearer(token)).expect(204);
    await t.http().get('/auth/me').set(bearer(token)).expect(401);
  });

  it('sessão expirada deixa de valer', async () => {
    await createAdmin(t.prisma);
    const token = await login(t.app, 'admin@test.local');

    await t.prisma.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await t.http().get('/auth/me').set(bearer(token)).expect(401);
  });

  it('limita a 5 tentativas de login por minuto por IP', async () => {
    await createAdmin(t.prisma);
    const attackerIp = '192.0.2.10';

    for (let attempt = 0; attempt < 5; attempt++) {
      await tryLogin('admin@test.local', 'errada-123', attackerIp).expect(401);
    }
    await tryLogin('admin@test.local', PASSWORD, attackerIp).expect(429);

    // Quem está em outro IP continua entrando normalmente.
    await tryLogin('admin@test.local', PASSWORD, '192.0.2.11').expect(200);
  });

  it('troca a senha e derruba as outras sessões', async () => {
    const { user } = await createBarber(t.prisma, 'Ragnar');
    const phone = await login(t.app, user.email);
    const laptop = await login(t.app, user.email);

    await t
      .http()
      .post('/auth/password')
      .set(bearer(laptop))
      .send({ currentPassword: 'errada-123', newPassword: 'nova-senha-456' })
      .expect(400);

    await t
      .http()
      .post('/auth/password')
      .set(bearer(laptop))
      .send({ currentPassword: PASSWORD, newPassword: 'nova-senha-456' })
      .expect(204);

    await t.http().get('/auth/me').set(bearer(laptop)).expect(200);
    await t.http().get('/auth/me').set(bearer(phone)).expect(401);
    await login(t.app, user.email, 'nova-senha-456');
  });
});
