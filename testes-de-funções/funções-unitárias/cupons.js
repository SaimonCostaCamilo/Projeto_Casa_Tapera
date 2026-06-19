export function validarCupomExistente(listaCupons, novoCupom) {
return listaCupons.some(cupom => cupom.codigo === novoCupom.codigo);
}
