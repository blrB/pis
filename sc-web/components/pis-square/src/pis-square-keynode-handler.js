PisSquareKeynodesHandler = {

    systemIds: [
        'nrel_area',
        'q_square_m'
    ],

    scKeynodes: {},

    load: false,

    initSystemIds : function (callback){
        var self = this;
        /**
         * Получение массива адресов для системных идентификаторов в массиве this.systemIds
         */
        SCWeb.core.Server.resolveScAddr(this.systemIds, function (keynodes) {
            Object.getOwnPropertyNames(keynodes).forEach(function(key) {
                console.log('Resolved keynode: ' + key + ' = ' + keynodes[key]);
                self.scKeynodes[key] = keynodes[key];
            });
            self.load = true;
            callback();
        });
    }

};
