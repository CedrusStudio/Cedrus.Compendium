/** Default: plan. Writes require an explicit mode, complete backup and journal.
 * See scripts/README.md for the review, apply and guarded rollback procedure.
 */
import { dataChangeFailure, runDataChangeCommand } from "../src/infrastructure/data-quality/runDataChangeCommand";

runDataChangeCommand(process.argv.slice(2))
  .then(report => console.log(JSON.stringify(report, null, 2)))
  .catch(error => { console.error(JSON.stringify(dataChangeFailure(error), null, 2)); process.exitCode = 1; });
