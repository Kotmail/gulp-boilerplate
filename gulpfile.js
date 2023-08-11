import gulp from 'gulp';
import pug from 'gulp-pug';
import browserSync from 'browser-sync';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import postCss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import styleLint from 'gulp-stylelint-esm'

const sass = gulpSass(dartSass);

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
    .pipe(gulp.dest('./public/'));
}

// Scss
export const compileScss = () => {
  return gulp.src('./src/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postCss([
      autoprefixer(),
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/'));
}

// Scss linting.
export const lintScss = () => {
  return gulp.src('./src/scss/**/*.scss')
    .pipe(styleLint({
      reporters: [
        {
          formatter: 'string',
          console: true,
        }
      ]
    }));
}

// Watch.
export const watch = () => {
  gulp.watch('./src/pug/**/*.pug', compilePug);
  gulp.watch('./src/scss/**/*.scss', gulp.series(lintScss, compileScss));
}

// Default.
export default gulp.series(
  compilePug,
  lintScss,
  compileScss,
  gulp.parallel(
    watch,
    browserSyncServe
  )
);