module.exports = {
    beacon: {
        /*prod: {
            minify: true,
            uglify: true,
            target: 'beacon_prod',
            index: 'index.bea.html',
        },*/
        docker: {
            minify: true,
            uglify: true,
            target: 'beacon_docker',
            index: 'index.bea.docker.html',
        },
        local: {
            minify: true,
            uglify: true,
            target: 'beacon_local',
            index: 'index.bea.local.html',
        }
    }
};
