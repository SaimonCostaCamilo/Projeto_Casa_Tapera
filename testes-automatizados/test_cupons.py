# =====================================================================
# 1. CÓDIGO DA FUNÇÃO (A lógica do projeto Tapera adaptada para Python)
# =====================================================================

def validar_cupom_existente(lista_cupons, novo_cupom):
    """
    Retorna True se o código do novo_cupom já existir na lista_cupons.
    O 'any' do Python faz exatamente o mesmo papel do '.some()' do JS.
    """
    return any(c['codigo'] == novo_cupom['codigo'] for c in lista_cupons)


# =====================================================================
# 2. CÓDIGO DOS TESTES UNITÁRIOS (Usando o módulo nativo do Python)
# =====================================================================
import unittest

class TestCuponsTapera(unittest.TestCase):

    def setUp(self):
        # Massa de dados de teste (Simulando cupons já cadastrados)
        self.lista_exemplo = [
            {'codigo': 'TAPERA10'},
            {'codigo': 'SAIBOT20'}
        ]

    def test_deve_retornar_true_se_o_cupom_ja_existir(self):
        novo_cupom = {'codigo': 'TAPERA10'}
        resultado = validar_cupom_existente(self.lista_exemplo, novo_cupom)
        self.assertEqual(resultado, True)

    def test_deve_retornar_false_se_o_cupom_for_novo(self):
        novo_cupom = {'codigo': 'CUPOMNOVO'}
        resultado = validar_cupom_existente(self.lista_exemplo, novo_cupom)
        self.assertEqual(resultado, False)


# =====================================================================
# 3. EXECUÇÃO AUTOMATIZADA NO TERMINAL
# =====================================================================
if __name__ == '__main__':
    # O parâmetro exit=False impede conflitos caso rode em ambientes como o VS Code ou Jupyter
    unittest.main(exit=False)