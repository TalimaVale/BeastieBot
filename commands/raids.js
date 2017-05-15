// Beastie's raid functionality
var raid = {
    
    // are we currently raiding
    raidPrep: false,

    // array of !raidready viewers
    raidTeam: [],

    // number of raidTeam members who have raided
    raidBonus: 0,

    // Beastie checks for raider messages in hosted channel's chat room
    checkRaidMessage: function(username){
        if(this.raidTeam.includes(username)){
            console.log("BEASTIE sees that another raider is here! Current raidBonus: " + this.raidBonus);
            this.raidBonus++;
            console.log("BEASTIE has increased the raid bonus: " + this.raidBonus);

            var index = this.raidTeam.indexOf(username);
            console.log("BEASTIE sees the user in the raidTeam: " + this.raidTeam[index]);

            if(index > -1) this.raidTeam.splice(index, 1);
            console.log("BEASTIE had removed the user from the raidTeam");
        }
    }
};

module.exports = raid;