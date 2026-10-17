import { pool } from '../../config/database.js';

export async function createUser({ nome, email, senhaHash }) {
  const result = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash)
     VALUES ($1, $2, $3)
     RETURNING id_usuario, nome, email`,
    [nome, email, senhaHash]
  );

  return result.rows[0] ?? null;
}

export async function deleteUser(id) {
  const result = await pool.query(
    `UPDATE usuarios
     SET ativo = false
     WHERE id_usuario = $1
     RETURNING id_usuario, ativo`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function alterarNome({id,nome}) {
    const result = await pool.query(
        `UPDATE usuarios SET nome = $1 WHERE id_usuario = $2 RETURNING id_usuario 
        `,[nome,id]
    );

    return result.rows[0] ?? null;
}

export async function alterarSenha({id, senhaHash}) {
    const result = await pool.query(
        `UPDATE usuarios SET senha_hash = $1 WHERE id_usuario = $2 RETURNING id_usuario 
        `,[senhaHash,id]
    );

    return result.rows[0] ?? null;
}

export async function buscarUsuarioPorId({id}) {
    const result = await pool.query(
        `SELECT id_usuario, email, ativo FROM usuarios WHERE id_usuario = $1`,[id]
    );
    return result.rows[0] ?? null;
}

export async function buscarUsuarioPorEmail({email}) {
    const result = await pool.query(
        `SELECT id_usuario, nome, email, senha_hash, ativo FROM usuarios where email = $1 AND ativo = true`, [email]
    );

    return result.rows[0] ?? null;
}