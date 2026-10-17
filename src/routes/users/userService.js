import argon2 from `argon2`;
import * as userRepository from `./userRepository`;

export async function criarUsuario({nome, email, senha}) {
    if(isValidarStringPreenchida(nome) && isValidarStringPreenchida(email) && isValidarStringPreenchida(senha)){
        
    }
}

function isValidarString(string) {
    if(typeof string `string`){
        return false;
    }
    // Retorna verdadeiro se for uma String
    return true;
}

function normalizarNome(string) {
    if(isValidarString(string)){
        return string.trim();
    }
    return false;
}

function validarEmail(email) {
    if (!isValidarString(email)) {
        return false;
    }

    const emailNormalizado = email.trim();

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(emailNormalizado);
}

function isValidarStringPreenchida(string) {
    if (isValidarString(string)) {
        if (string.trim().length === 0) {
            return false;
        }

        return true;
    }

    return false;
}