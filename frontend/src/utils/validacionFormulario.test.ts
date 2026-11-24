import { describe, expect, it } from 'vitest';
import { validarCodigo, validarContrasenaNueva, validarCorreo } from './validacionFormulario';

describe('validarCorreo', () => {
  it('acepta correos válidos', () => {
    expect(validarCorreo('nombre@gmail.com')).toBe('');
    expect(validarCorreo('  turista@senderia.cl ')).toBe('');
    expect(validarCorreo('a.b+c@sub.dominio.cl')).toBe('');
  });

  it('explica con claridad qué le falta al correo', () => {
    expect(validarCorreo('')).toMatch(/Ingresa tu correo/);
    expect(validarCorreo('nombre.gmail.com')).toMatch(/falta el signo @/);
    expect(validarCorreo('@gmail.com')).toMatch(/antes del @/);
    expect(validarCorreo('nombre@')).toMatch(/después del @/);
    expect(validarCorreo('rigoberto@.com')).toMatch(/falta el proveedor .* antes del punto/);
    expect(validarCorreo('nombre@gmail')).toMatch(/falta la terminación/);
    expect(validarCorreo('nombre@gmail.c')).toMatch(/terminación del correo está incompleta/);
    expect(validarCorreo('nombre@gmail.')).toMatch(/terminación del correo está incompleta/);
    expect(validarCorreo('nom bre@gmail.com')).toMatch(/espacios/);
    expect(validarCorreo('a@b@gmail.com')).toMatch(/solo puede tener un signo @/);
    expect(validarCorreo('nombre@gmail..com')).toMatch(/dos puntos seguidos/);
  });
});

describe('validarContrasenaNueva', () => {
  it('indica el requisito que falta', () => {
    expect(validarContrasenaNueva('abc1', 'abc1')).toMatch(/al menos 8 caracteres \(llevas 4\)/);
    expect(validarContrasenaNueva('12345678', '12345678')).toMatch(/una letra/);
    expect(validarContrasenaNueva('abcdefgh', 'abcdefgh')).toMatch(/un número/);
    expect(validarContrasenaNueva('abcdefg1', '')).toMatch(/Repite la contraseña/);
    expect(validarContrasenaNueva('abcdefg1', 'abcdefg2')).toMatch(/no coinciden/);
    expect(validarContrasenaNueva('abcdefg1', 'abcdefg1')).toBe('');
  });
});

describe('validarCodigo', () => {
  it('exige 6 dígitos', () => {
    expect(validarCodigo('')).toMatch(/Ingresa el código/);
    expect(validarCodigo('123')).toMatch(/llevas 3/);
    expect(validarCodigo('123456')).toBe('');
  });
});
