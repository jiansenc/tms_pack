import { getProjectByUID } from '@/utils/index.js';
import { join } from 'path';
import { Glob } from 'bun';
import { normalize } from 'node:path';
import workers from '@/utils/workers.js';

const wk = workers();
async function packaged({ projectId, command, env, autoUpload }, callback) {
  let JOB = getProjectByUID(projectId);
  JOB.command = command;
  JOB.env = env;
  JOB.autoUpload = autoUpload;
  wk.addWorker(JOB, callback);
  wk.run();
}
export default packaged;
