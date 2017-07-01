Object.assign(module, {
    exports(){
        const app = this;
        app.use("/api/redemptions", {
            async get(id, params){
                return Promise.reject(new errors.NotFound("No redemption found."));
            },
            async patch(id, params){
                return Promise.reject(new errors.NotFound("No redemption found."));
            },
            async find(params){
                return { redemptions: [] };
            }
        });
    }
});