import { $ } from 'bun';
import { zip, COMPRESSION_LEVEL } from 'zip-a-folder';
import { join } from 'path';
import { mkdir } from 'node:fs/promises';
import SftpClient from 'ssh2-sftp-client';
import ssh2 from 'ssh2';
import { Glob } from 'bun';
import { createCallbackLogger } from './logger.js';

const list = [];
//  working, done
let workerStatus = 'empty';

const useWorkers = () => {
  const addWorker = (worker, callback) => {
    worker.workerId = Bun.randomUUIDv7();
    worker.callback = callback;
    list.push(worker);
  };

  const getWorkers = () => {
    return list;
  };

  const run = async () => {
    const sftp = new SftpClient();
    const ssh = new ssh2.Client();
    const worker = list.splice(0, 1)[0];

    if (!worker) {
      console.warn('No workers in queue');
      return;
    }

    // Create logger with callback
    const logger = createCallbackLogger(worker.callback);
    logger.section(`开始执行打包部署`);
    const nodev = (await $`node -v`.text()).trim();
    worker.useNodeVersion = nodev.replace('v', '').split('.')[0];
    await $`nvm use ${worker.node_version}`.text();
    logger.info(`项目UID:${worker.uid}[${worker.env}] ${worker.command}, 切换 Node.js 版本:[${worker.node_version}]`);
    try {
      logger.info(`正在构建项目: ${worker.path} ${worker.command}`);
      await $`bun run ${worker.command}`.cwd(worker.path).text();
      logger.info(`[${worker.uid}] 项目构建完成`);
      // Step 3: Create ZIP file
      const nowDate = new Date().toLocaleDateString('en-CA').split('-').join('');
      const nowDay = nowDate.substring(4, 8);
      const zipPath = join(import.meta.dirname, `../packages/${nowDate}/${worker.env}`);
      await mkdir(zipPath, { recursive: true });

      let count = 0;
      const glob = new Glob(`${zipPath}/${worker.uid}_${worker.env}*.zip`);
      for (const fileUrl of glob.scanSync('.')) {
        count++;
      }

      const fileName = `${worker.uid}_${worker.env}_${nowDay}-${count + 1}.zip`;
      const filePath = join(zipPath, fileName);
      const sourcePath = `${worker.path}/dist`;

      logger.info(`创建 ZIP 压缩包 ${filePath}`);
      await zip(sourcePath, filePath, {
        compression: COMPRESSION_LEVEL.high,
      });
      // Step 4: Upload to SFTP
      //
      if (!worker.autoUpload) {
        worker.callback({
          log: '打包部署完成',
          status: 'success',
          workerId: worker.workerId,
          fileName: fileName,
        });
        return;
      }

      const remotePath = `${worker.ssh.sshpath}/dist.zip`;
      logger.info(`上传到 SFTP 服务器 ${worker.ssh.host} -> ${remotePath}`);
      await sftp.connect(worker.ssh);
      await sftp.put(filePath, remotePath);
      await sftp.end();
      await new Promise((resolve, reject) => {
        ssh
          .connect(worker.ssh)
          .on('ready', () => {
            logger.info('SSH 连接成功, 正在解压文件..');
            resolve(ssh);
          })
          .on('error', (err) => {
            logger.error('SSH 连接失败:', err.message);
            reject(err.message);
          });
      });
      // rm -rf /app/nginx-9182-admin/*
      logger.info('清空目录 static, assets');
      await sshExec(ssh, `rm -rf ${worker.ssh.sshpath}/static ${worker.ssh.sshpath}/assets`);
      await sshExec(ssh, `unzip -o ${remotePath} -d ${worker.ssh.sshpath}/`);

      logger.info('文件解压完成');
      if (worker.ssh.afterCommand) {
        logger.info(`执行后置命令${worker.ssh.afterCommand}`);
        await sshExec(ssh, worker.ssh.afterCommand);
        logger.info('后置命令执行完成');
      } else {
        logger.success(`完成所有操作,打包部署完成[${worker.uid}][${worker.env}]`);
      }
      worker.callback({
        log: '打包部署完成',
        status: 'success',
        workerId: worker.workerId,
        fileName: fileName,
      });
      workerStatus = 'empty';
      ssh.end();
    } catch (error) {
      logger.error('部署过程出错:', error.message);
      if (ssh) {
        try {
          ssh.end();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      if (sftp) {
        try {
          await sftp.end();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      worker.callback({
        log: `发布失败: ${error.message}`,
        status: 'error',
        workerId: worker.workerId,
        type: 'error',
      });

      workerStatus = 'empty';
    } finally {
      await $`nvm use ${worker.useNodeVersion}`.text();
    }
  };

  return { addWorker, getWorkers, run };
};

/**
 * Execute command via SSH
 * @param {Object} ssh - SSH client instance
 * @param {string} command - Command to execute
 * @returns {Promise<void>}
 */
async function sshExec(ssh, command) {
  return await new Promise((resolve, reject) => {
    ssh.exec(command, (err, stream) => {
      if (err) {
        console.error('SSH 执行错误:', err);
        return reject(err.message);
      }

      stream
        .on('data', (data) => {})
        .on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject({ message: `命令执行失败，退出码: ${code}` });
          }
        })
        .stderr.on('data', (data) => {
          const errorMsg = data.toString();
          console.error('[SSH错误]', errorMsg);
          reject({ message: errorMsg });
        });
    });
  });
}

export default useWorkers;
