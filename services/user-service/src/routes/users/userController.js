import * as userService from './userService.js';

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
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Erro ao apagar usuário'
        });
    }
}
