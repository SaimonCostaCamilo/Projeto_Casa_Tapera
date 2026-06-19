import { test, expect } from 'vitest';
import { validarCupomExistente } from './cupons.js';

// Massa de dados de teste (simulando o que estaria no seu array)
const listaDeCuponsExemplo = [
  { codigo: 'TAPERA10', desconto: 10 },
  { codigo: 'SAIBOT20', desconto: 20 }
];

test('Deve retornar TRUE se o código do cupom já existir na lista', () => {
  const novoCupomRepetido = { codigo: 'TAPERA10', desconto: 15 };
  const resultado = validarCupomExistente(listaDeCuponsExemplo, novoCupomRepetido);

  expect(resultado).toBe(true);
});

test('Deve retornar FALSE se o código do cupom for novo', () => {
  const novoCupomInedito = { codigo: 'PROFE100', desconto: 100 };
  const resultado = validarCupomExistente(listaDeCuponsExemplo, novoCupomInedito);

  expect(resultado).toBe(false);
});