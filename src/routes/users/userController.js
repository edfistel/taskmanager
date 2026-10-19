import * as userService from './userService.js';

export async function criarUsuario(req, res){
    try {
        const { nome, email, senha } = req.body;
        const usuario = await userService.criarUsuario({nome, email, senha});

        return res.status(201).json({message: 'Usuário criado com sucesso', body: usuario});

    }catch(error){
        return res.status(400).json({message: error.message});
    }
}
