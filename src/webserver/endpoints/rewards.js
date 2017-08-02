Object.assign(module, {
    exports(){
        const app = this;
        app.use("/api/rewards", {
            async get(id, params){
                return Promise.reject(new errors.NotFound("No reward found."));
            },
            async find(params){
                return { rewards: [] };
            }
        });
    }
});