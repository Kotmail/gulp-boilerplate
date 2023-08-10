import gulp from 'gulp';
import pug from 'gulp-pug';
import browserSync from 'browser-sync';

// BrowserSync.
export const browserSyncServe = () => {
  return browserSync.init({
    server: './public',
    watch: true,
  });
};

// Pug.
export const compilePug = () => {
  return gulp.src('./src/pug/pages/*.pug')
    .pipe(pug({
      pretty: true,
    }))
    .pipe(gulp.dest('./public/'))
}

// Watch.
export const watch = () => {
  gulp.watch('./src/pug/**/*.pug', gulp.series(compilePug));
}

// Default.
export default gulp.series(
  gulp.parallel(
    compilePug
  ),
  gulp.parallel(
    watch,
    browserSyncServe
  )
);