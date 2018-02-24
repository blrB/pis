module.exports = function() {

    var kb = 'kb/pis-square/';
    var components = 'sc-web/components/pis-square/';
    var clientJsDirPath = '../sc-web/client/static/components/js/';
    var clientCssDirPath = '../sc-web/client/static/components/css/';
    var clientHtmlDirPath = '../sc-web/client/static/components/html/';
    var clientImgDirPath = '../sc-web/client/static/components/images/';

    return  {
        concat: {
            pis_squarecmp: {
                src: [
                    components + 'src/pis-square.js',
                    components + 'src/pis-square-keynode-handler.js',
                    components + 'src/pis-square-component.js'
                ],
                dest: clientJsDirPath + 'pis_square/pis_square.js'
            }
        },
        copy: {
            pis_squareIMG: {
                cwd: components + 'static/components/images/',
                src: ['*'],
                dest: clientImgDirPath + 'pis_square/',
                expand: true,
                flatten: true
            },
            pis_squareJS: {
                cwd: components + 'static/components/js/',
                src: ['*.js'],
                dest: clientJsDirPath + 'pis_square/',
                expand: true,
                flatten: true
            },
            pis_squareCSS: {
                cwd: components + 'static/components/css/',
                src: ['pis_square.css'],
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            pis_squareHTML: {
                cwd: components + 'static/components/html/',
                src: ['*.html'],
                dest: clientHtmlDirPath,
                expand: true,
                flatten: true
            },
            kb: {
                cwd: kb,
                src: ['*'],
                dest: '../kb/pis_square/',
                expand: true,
                flatten: true
            }
        },
        watch: {
            pis_squarecmp: {
                files: components + 'src/**',
                tasks: ['concat:pis_squarecmp']
            },
            pis_squareIMG: {
                files: [components + 'static/components/images/**'],
                tasks: ['copy:pis_squareIMG']
            },
            pis_squareCSS: {
                files: [components + 'static/components/css/**'],
                tasks: ['copy:pis_squareCSS']
            },
            pis_squareHTML: {
                files: [components + 'static/components/html/**'],
                tasks: ['copy:pis_squareHTML']
            },
            copyKB: {
                files: [kb + '**'],
                tasks: ['copy:kb']
            }
        },
        exec: {
          updateCssAndJs: 'sh add-css-and-js.sh'
        }
    }
};

