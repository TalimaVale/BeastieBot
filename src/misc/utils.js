const fs = require("fs");
const util = require("util");
const path = require("path");

const forever = require("forever-monitor");
const ipc = require("node-ipc");
const ini = require("ini");
const csv = require("csv");

ipc.config.silent = true;
ipc.config.id = "beastie";
ipc.config.retry = 1500;

const root = path.resolve(__dirname, "../../");
const _ = module.exports = Object.setPrototypeOf({
    fs: {
        unlink: util.promisify(fs.unlink),
        read: util.promisify(fs.readFile),
        write: util.promisify(fs.writeFile),
        mkdirp: util.promisify(require("mkdirp")),
    },
    csv: {
        root,
        decode(text, opts = {}){
            return new Promise((resolve, reject) => {
                csv.parse(text, _.defaults(opts, {
                    columns: true
                }), (error, table) => {
                    if(error) reject(error);
                    else resolve(table);
                });
            });
        },
        encode(data, opts = {}){
            return new Promise((resolve, reject) => {
                csv.stringify(data, _.defaults(opts, {
                    header: true
                }), (error, text) => {
                    if(error) reject(error);
                    else resolve(text);
                });
            });
        },
        async read(file, opts = { mkdir: false }){
            file = path.resolve(this.root, `${file}.csv`);
            if(opts.mkdir) await _.fs.mkdirp(path.dirname(file));
            return await _.fs.read(file, "utf8")
                .then(contents => this.decode(contents, opts))
                .catch(() => null);
        },
        async write(file, contents, opts = {}){
            if(!_.isString(contents)) contents = await this.encode(contents, opts);
            file = path.resolve(this.root, `${file}.csv`);
            await _.fs.mkdirp(path.dirname(file));
            await _.fs.write(file, contents);
        }
    },
    ini: {
        root,
        safe(text){ return ini.safe(text); },
        unsafe(text){ return ini.unsafe(text); },
        
        encode(data){ return ini.encode(data); },
        decode(text){ return ini.decode(text); },
        async read(file, opts = { mkdir: false }){
            file = path.resolve(this.root, `${file}.ini`);
            if(opts.mkdir) await _.fs.mkdirp(path.dirname(file));
            return await _.fs.read(file, "utf8")
                .then(contents => this.decode(contents))
                .catch(()=>null);
        },
        async write(file, contents, opts = {}){
            if(!_.isString(contents)) contents = await this.encode(contents);
            file = path.resolve(this.root, `${file}.ini`);
            await _.fs.mkdirp(path.dirname(file));
            await _.fs.write(file, contents);
        }
    },
    pid: {
        root: path.resolve(root, "pids/"),
        async unlink(file){
            file = path.resolve(this.root, `${file}.pid`);
            return _.fs.unlink(file);
        },
        // caveat: returns false if testing against our own pid
        async check(file){
            const pid = await this.read(file);
            if(pid === null) return false;
            if(!require("is-running")(pid)) {
                await this.unlink(file);
                return false;
            }
            return pid != process.pid;
        },
        async read(file, opts = { unlink: false, mkdir: false }){
            if(opts.unlink) await this.check(file);
            file = path.resolve(this.root, `${file}.pid`);
            if(opts.mkdir) await _.fs.mkdirp(path.dirname(file));
            return _.fs.read(file, "utf8")
                .catch(() => null);
        },
        async write(file, contents = process.pid, opts = { check: true }){
            if(opts.check && await this.check(file)) 
                throw new Error(`pid file "${file}.pid" appears to already be in use.`);
            file = path.resolve(this.root, `${file}.pid`);
            await _.fs.mkdirp(path.dirname(file));
            await _.fs.write(file, contents+"");
        },

        async kill(file){
            if(await _.pid.check(file))
                return process.kill(await _.pid.read(file), "SIGKILL");
        },
    },
    ipc: {

    },

    sleep(time = 0){
        let timer;
        const promise = new Promise(resolve => timer = (time == 0 ? setImmediate : setTimeout)(resolve, time));
        const _unref = promise.unref;
        promise.unref = () => {
            if(timer && timer.unref) timer.unref();
            if(_unref) _unref.call(promise);
            return promise;
        };
        return promise;
    },

    persevere(opts = {}){
        _.defaults(opts, {
            retries: 3,
            timeout: 1000,
            decay: 2,
            maxTimeout: 30*1000,
        });

        return async action => {
            let times = 0, errors = [];
            while(opts.retries-- > 0){
                try {
                    return await action();
                } catch(error) {
                    errors.push(error);
                    if(opts.retries <= 0) throw errors;
                    await _.sleep(Math.min(opts.timeout * Math.pow(opts.decay, ++times), opts.maxTimeout));
                }
            }
            throw errors;
        };
    },

    exitHandler(callback){
        process.cleanup = [];
        process.once("SIGTERM", async () => {
            let counter = 0, max = 5;
            process.on("SIGINT", async () => {
                if(++counter == max){
                    console.error("Stopping immediately!");
                    process.exit(process.exitCode = 1);
                    while(true);
                } else {
                    console.log("Send SIGINT %s more times to stop immediately.", max - counter);
                }
            });
            setTimeout(() => process.exit(1), 10 * 1000).unref();
            try {
                while(process.cleanup.length > 0)
                    await process.cleanup.shift()();
                await callback();
            } catch(err){
                console.error(err);
                return process.exit(1);
            } finally {
                process.exit(process.exitCode);
            }
        });
        process.on("SIGINT", () => process.emit("SIGTERM"));
        process.on("uncaughtException", err => {
            console.error("Error, uncaughtException");
            console.error(err);
            process.exitCode = 1;
            process.emit("SIGTERM");
        });
        process.on("unhandledRejection", (err, p) => {
            console.error("Error, unhandledRejection. Promise: ", p);
            console.error(err);
            process.exitCode = 1;
            process.emit("SIGTERM");
        });
    },

    exit(exitCode = process.exitCode){
        return new Promise(resolve => {
            process.once("exit", resolve);
            process.exitCode = exitCode;
            process.emit("SIGTERM");
        });
    },


    async lockProcess(name){
        await _.pid.write(name, process.pid+"").catch(error => {
            return Promise.reject("${name} is another active process. Unable to lock.");
        });
        process.cleanup.push(() => _.pid.unlink(name));

        ipc.config.id = name;

        const ipcServer = await new Promise((resolve, reject) => {
            ipc.serve(err => {
                if(err) reject(err);
                else resolve(ipc.server);
            });
            ipc.server.start();
        });
        process.cleanup.push(() => ipcServer.stop());
        ipcServer.on("SIGTERM", id => ipc.config.id == id ? _.exit(0) : null);

        return {
            pid: process.pid,
            ipc: ipcServer,
            exit: _.exit,
        };
    },

    async stopProcess(ipcClient){
        if(!ipcClient) return;
        if(typeof ipcClient == "string" && ipcClient in ipc.of) 
            ipcClient = ipc.of[ipcClient];
        else if(typeof ipcClient == "string")
            ipcClient = await _.connectProcess(ipcClient, true);
        else if(typeof ipcClient != "object")
            throw new Error(`Unable to stopProcess ${ ipcClient.name || ipcClient.id }`);
        if(ipcClient.monitor){
            ipcClient.monitor.forceStop = true;
            ipcClient.monitor.max = ipcClient.monitor.times;
            ipcClient.monitor.child.unref();
            ipcClient.monitor.removeAllListeners("exit:code");
        }
        setImmediate(()=>ipcClient.emit("SIGTERM", ipcClient.id));
        await Promise.race([
            new Promise(resolve => {
                const finish = event => {
                    // try { if(ipcClient.monitor) ipcClient.monitor.stop(); } catch(e){}
                    if(event) clearImmediate(event);
                    ipcClient.destroy();
                    ipcClient.off("socket-close", finish);
                    if(ipcClient.monitor) ipcClient.monitor.removeListener("exit", finish);
                    resolve();
                };
                ipcClient.on("socket-close", finish);
                if(ipcClient.monitor) ipcClient.monitor.on("exit", finish);
            }),
            // new Promise((resolve, reject) => setTimeout(()=>reject("stopProcess timeout!"), 5*1000).unref())
        ]);
        return true;
    },

    async startForeverProcess(script, config, name){
        const monitor = new (forever.Monitor)(script, Object.assign({
            args: ["--color"],
            killSignal: "SIGTERM"
        }, config));
        setImmediate(()=>monitor.start());
        let timer = _.sleep(5000);
        monitor.on("exit:code", code => {
            monitor.stop();
            timer.then(()=>{
                timer = _.sleep(5000);
                monitor.start();
            });
        });
        await new Promise((resolve, reject) => monitor.once("start", resolve));
        return await new Promise(async (resolve, reject) => {
            try {
                const ipcClient = await _.connectProcess(name, true, 5000);
                ipcClient.monitor = monitor;
                resolve(ipcClient);
            } catch(err){
                reject(err);
            }
        });
    },

    async connectProcess(name, force = false, timeout = 50){
        if(!force){
            const pidFile = path.resolve(__dirname, `../../pids/${name}.pid`);
            const pid = await _.fs.read(pidFile, "utf8").catch(() => null);
            if(pid === null || !require("is-running")(pid))
                throw new Error(`${name} does not appear to be running. (PID file not found)`);
        }

        return await new Promise((resolve, reject) => {
            var started = Date.now();
            ipc.connectTo(name, (...args) => {
                const ipcClient = ipc.of[name];

                let connected = false, disconnected = false;
                let onconnect, ondisconnect;
                const cleanup = () => {
                    ipcClient.off("connect", onconnect);
                    ipcClient.off("disconnect", ondisconnect);
                };
                ipcClient.on("connect", onconnect = () => {
                    if(!ipcClient || disconnected) return;
                    connected = true;
                    cleanup();
                    resolve(Object.assign(ipcClient, {
                        disconnect: () => ipcClient.disconnect()
                    }));
                });
                ipcClient.on("disconnect", ondisconnect = () => {
                    if(!ipcClient || connected) return;
                    if(Date.now() - started < timeout) return;
                    disconnected = false;
                    cleanup();
                    reject(new Error("IPC Connection Failed"));
                });

                let _close = ipcClient.socket._events.close;
                ipcClient.socket.removeAllListeners("close");
                ipcClient.socket.on("close", (...args) => {
                    ipcClient.publish("socket-close", setImmediate(() => {
                        if(ipcClient._destroyed != true){
                            _close(...args);
                        } else {
                            console.log("DARNIT");
                        }
                    }));
                });
                // monkey patch a .destroy() method:
                ipcClient.destroy = () => {
                    ipcClient._destroyed = true;
                    Object.keys(ipcClient._events_).forEach(e => ipcClient.off(e, "*"));
                    if(ipcClient.socket){
                        ipcClient.socket.removeAllListeners();
                        ipcClient.socket.unref();
                        ipcClient.socket.destroy();
                    }
                    ipc.disconnect(name);
                };
                // monkey patch a .once() method:
                ipcClient.once = (event, listener) => {
                    let once = false;
                    const handler = (...args) => {
                        if(once) return;
                        once = true;
                        listener(args);
                        ipcClient.off(event, handler);
                    };
                    ipcClient.on(event, handler);
                };
            });
        });
    }
}, require("lodash"));