/**
 * Спецификация компонента
 */
PisSquareComponent = {
    ext_lang: 'pis_square_code',
    formats: ['format_pis_square_json'],
    struct_support: true,

    factory: function(sandbox) {
        return new pisSquareViewerWindow(sandbox);
    }
};

var pisSquareViewerWindow = function(sandbox) {

    var self = this;
    this.sandbox = sandbox;
    this.container = sandbox.container;
    this.pisSquare = new PisSquare();

    var autocompletionVariants = function(keyword, callback, self) {

        /**
         * Поиск узлов содержащих подстроку keyword в своем идентификаторе
         */
        SCWeb.core.Server.findIdentifiersSubStr(keyword, function(data) {
            keys = [];
            for (key in data) {
                var list = data[key];
                for (idx in list) {
                    var value = list[idx]
                    keys.push({name: value[1], addr: value[0], group: key});
                }
            }

            callback(keys);
        });
    };

    function createPisSquareView() {
        self.pisSquare.init({
            sandbox: sandbox,
            containerId: sandbox.container,
            autocompletionVariants : autocompletionVariants,
            resolveControls: self.sandbox.resolveElementsAddr
        });
    }

    var promise = new Promise(function(resolve) {
        if (PisSquareKeynodesHandler.load == false){
            PisSquareKeynodesHandler.initSystemIds(function () {
                resolve();
            });
        } else {
            resolve();
        }
    });

    promise.then(createPisSquareView());
};

/**
 * Добавление компонента в систему
 */
SCWeb.core.ComponentManager.appendComponentInitialize(PisSquareComponent);


