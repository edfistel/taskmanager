import argon2 from `argon2`;
import * as userRepository from `./userRepository`;

export async function criarUsuario({nome, email, senha}) {
    if(isValidarStringPreenchida(nome) && isValidarStringPreenchida(email) && isValidarStringPreenchida(senha)){
        
    }
}

function isValidarString(string) {
    if(string !== `string`){
        return false;
    }
    // Retorna verdadeiro se for uma String
    return true;
}

function normalizarNome(string) {
    if(isValidarString(string.trim())){
        return string.trim();
    }
}
function isValidarEmail(email) {
    
}
function normalizarEmail(email) {

}
function isValidarStringPreenchida(string){
    if(isValidarString(string.trim())){
        if(string == null || string.trim().length === 0) {
        return false;
    }
    // A variavel do parametro não é uma String
    return false;
    }
    // Retorna verdadeiro se o dado imputado não estiver vazio.
    return true;
}
