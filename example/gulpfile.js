const gulp = require('gulp');
const babel = require('gulp-babel');
const rimraf = require('rimraf');
const exec = require('child_process').exec;

gulp.task('bab', () =>
  gulp.src('index.js')
  .pipe(babel({
    plugins: [
      'syntax-flow',
      ['transform-niverso',  {
        'relation': 'example-relation'
      }]
    ],
  }))
  .pipe(gulp.dest('_tmp'))
);

gulp.task('flow', ['bab'], (cb) =>
  exec('./node_modules/.bin/flow check-contents < _tmp/index.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  })
);

gulp.task('strip', ['flow'], (cb) =>
  gulp.src('_tmp/index.js')
  .pipe(babel({
    plugins: ["transform-flow-strip-types"],
  }))
  .pipe(gulp.dest('dist'))
);

gulp.task('strip2', (cb) =>
  gulp.src('_tmp/index.js')
  .pipe(babel({
    plugins: ["transform-flow-strip-types"],
  }))
  .pipe(gulp.dest('dist'))
);

gulp.task('rm', ['strip'], (cb) => rimraf('./_tmp', cb));
gulp.task('rm2', ['strip2'], (cb) => rimraf('./_tmp', cb));

gulp.task('default', ['rm']);
gulp.task('build', ['rm2']);
