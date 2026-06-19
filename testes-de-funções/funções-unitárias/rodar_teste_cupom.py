def validar_cupom_existente(lista_cupons, novo_cupom):
    return any(cupom['codigo'] == novo_cupom['codigo'] for cupom in lista_cupons)


def main():
    lista_de_cupons_exemplo = [
        {'codigo': 'TAPERA10', 'desconto': 10},
        {'codigo': 'SAIBOT20', 'desconto': 20}
    ]

    novo_cupom_repetido = {'codigo': 'TAPERA10', 'desconto': 15}
    novo_cupom_inedito = {'codigo': 'PROFE100', 'desconto': 100}

    resultado1 = validar_cupom_existente(lista_de_cupons_exemplo, novo_cupom_repetido)
    resultado2 = validar_cupom_existente(lista_de_cupons_exemplo, novo_cupom_inedito)

    print('Teste 1 (cupom repetido):', resultado1)
    print('Teste 2 (cupom novo):', resultado2)
    print('Resultado esperado: True, False')
    print('STATUS:', 'PASSOU' if resultado1 and not resultado2 else 'FALHOU')


if __name__ == '__main__':
    main()
