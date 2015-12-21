// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '../../..',
        frameworks: ['jasmine'],
        files: [
					  'bower_components/lodash/lodash.js',
            '.tmp/*.js',
            'src/test/typescript/**/!(karma.conf).js'
        ],
        exclude: [],
        port: 9876,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['PhantomJS'],
        singleRun: false
    });
};
