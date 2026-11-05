import * as userService from './userService.js';

export async function criarUsuario(req, res) {
    try {
        const { nome, email, senha } = req.body || {};
        const usuario = await userService.criarUsuario({nome, email, senha});

        return res.status(201).json({success: true, body: usuario});

    }catch(error){
        const status = error.code === 'P2002' || error.message?.includes('já cadastrado')
            ? 409
            : [
                'Dados de cadastro inválidos',
                'E-mail inválido',
                'A senha deve ter pelo menos 8 caracteres'
            ].includes(error.message)
                ? 400
                : 500;

        return res.status(status).json({success: false, message: error.message});
    }
}

export async function buscarUsuarioPorEmail(req, res) {
    try{

        const email = req.params.email;
        const usuario = await userService.buscarUsuarioPorEmail(email);

        if(!usuario){
            return res.status(404).json({success: false, message: 'Usuário não encontrado, ou email inválido'});
        }

        return res.status(200).json({success: true, body:{id: usuario.id, nome: usuario.nome, email: usuario.email}});

    }catch(error) {
        const status = [
            'O email precisa ser preenchido',
            'Digite um email válido'
        ].includes(error.message) ? 400 : 500;

        return res.status(status).json({success: false, message: error.message});
    }
}

export async function buscarMeuPerfil(req, res) {
    try {
        const id = req.user.id;

        const usuario = await userService.buscarUsuarioPorId(id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            body: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao consultar perfil'
        });
    }
}

export async function alterarSenha(req, res) {
    try {
        const id = req.user.id;
        const { senhaAtual, novaSenha } = req.body;

        await userService.alterarSenhaDoUsuario({
            id,
            senhaAtual,
            novaSenha
        });

        return res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        const status = error.message === 'Usuário não encontrado'
            ? 404
            : error.message === 'Senha atual incorreta'
                ? 403
                : [
                    'A senha precisa ser preenchida',
                    'A senha precisa ter no mínimo 8 caracteres'
                ].includes(error.message)
                    ? 400
                    : 500;

        return res.status(status).json({
            success: false,
            message: error.message
        });
    }
}

export async function apagarUsuario(req, res) {
    try {
        const id = req.user.id;

        const usuario = await userService.apagarUsuario(id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Usuário apagado com sucesso'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao apagar usuário'
        });
    }
}
