import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";

/**
 * Handles DELETE /api/tasks/:id
 * Deletes a task from the database using the provided task ID.
 */
export async function deleteTask(url: URL, db: Database) {
  const param = url.pathname.split("/").pop();
  const id = Number(param);

  logger.info(`DELETE /api/tasks/{:id} endpoint called with id: ${param}`);

  // Validate the provided task ID
  if (isNaN(id)) {
    logger.error(
      `DELETE /api/tasks/{:id} endpoint. Invalid task id: ${param}\n`,
    );

    return new Response("Invalid task id", { status: 400 });
  }

  // Remove the task from the database
  const deleteQuery = db.query(`DELETE FROM tasks WHERE id = ?`);
  const result = deleteQuery.run(id);

  // Return 404 if the task does not exist
  if (result.changes === 0) {
    logger.error(
      `DELETE /api/tasks/{:id} endpoint. Task with id: ${id} does not exist\n`,
    );

    return new Response(`Task with id ${id} does not exist`, {
      status: 404,
    });
  }

  logger.info(
    `DELETE /api/tasks/{:id} endpoint. Task with id: ${id} deleted successfully\n`,
  );

  return new Response(JSON.stringify({ success: true, deletedId: id }), {
    headers: { "Content-Type": "application/json" },
  });
}
