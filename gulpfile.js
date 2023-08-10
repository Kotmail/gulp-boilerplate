import gulp from 'gulp';
import pug from 'gulp-pug';

// Pug.
export const compilePug = () => {
  return gulp.src('./src/pug/pages/*.pug')
    .pipe(pug({
      pretty: true,
    }))
    .pipe(gulp.dest('./public/'))
}