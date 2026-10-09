import {
  addDays,
  minutesToTime,
  timeToMinutes,
  toShopTime,
  weekdayOf,
  zonedDayRange,
  zonedInstant,
} from './shop-time.js';

const SAO_PAULO = 'America/Sao_Paulo';

describe('shop-time', () => {
  it('converte HH:mm em minutos e de volta', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(minutesToTime(1440)).toBe('24:00');
  });

  it('calcula o instante de um horário local de São Paulo', () => {
    expect(zonedInstant('2026-10-13', 9 * 60, SAO_PAULO).toISOString()).toBe(
      '2026-10-13T12:00:00.000Z',
    );
  });

  it('calcula o dia local inteiro, com fim exclusivo', () => {
    const { start, end } = zonedDayRange('2026-10-13', SAO_PAULO);
    expect(start.toISOString()).toBe('2026-10-13T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-14T03:00:00.000Z');
  });

  it('respeita o horário de verão de outros fusos', () => {
    // Em Nova York o dia 08/03/2026 tem só 23 horas.
    const { start, end } = zonedDayRange('2026-03-08', 'America/New_York');
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it('mostra um instante no relógio da barbearia', () => {
    const local = toShopTime(new Date('2026-10-14T02:30:00Z'), SAO_PAULO);
    expect(local).toEqual({
      date: '2026-10-13',
      weekday: 2,
      minutes: 23 * 60 + 30,
    });
  });

  it('descobre o dia da semana e soma dias', () => {
    expect(weekdayOf('2026-10-11')).toBe(0);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
