-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDO');
ALTER TABLE "Tarefa" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tarefa" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "Tarefa" ALTER COLUMN "status" SET DEFAULT 'A_FAZER';
COMMIT;

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Quadro" DROP CONSTRAINT "Quadro_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Lista" DROP CONSTRAINT "Lista_quadroId_fkey";

-- DropForeignKey
ALTER TABLE "Tarefa" DROP CONSTRAINT "Tarefa_listaId_fkey";

-- DropForeignKey
ALTER TABLE "Subtarefa" DROP CONSTRAINT "Subtarefa_tarefaId_fkey";

-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_tarefaId_fkey";

-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "AtribuirTarefa" DROP CONSTRAINT "AtribuirTarefa_tarefaId_fkey";

-- DropForeignKey
ALTER TABLE "AtribuirTarefa" DROP CONSTRAINT "AtribuirTarefa_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Tarefa" ALTER COLUMN "prazo" SET DATA TYPE DATE,
ALTER COLUMN "status" SET DEFAULT 'A_FAZER';

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quadro" ADD CONSTRAINT "Quadro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lista" ADD CONSTRAINT "Lista_quadroId_fkey" FOREIGN KEY ("quadroId") REFERENCES "Quadro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "Lista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtarefa" ADD CONSTRAINT "Subtarefa_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtribuirTarefa" ADD CONSTRAINT "AtribuirTarefa_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtribuirTarefa" ADD CONSTRAINT "AtribuirTarefa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

