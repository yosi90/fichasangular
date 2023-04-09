import { Empleado } from './empleado.model';

describe('Empleado', () => {
  it('should create an instance', () => {
    expect(new Empleado('', '', 0, '')).toBeTruthy();
  });
});
