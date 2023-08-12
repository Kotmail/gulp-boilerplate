import gulp from 'gulp';
import pug from 'gulp-pug';
import browserSync from 'browser-sync';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import postCss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import styleLint from 'gulp-stylelint-esm'
import { deleteAsync } from 'del';
import imagemin from 'gulp-imagemin';
import svgSprite from 'gulp-svg-sprite';
import webpack from 'webpack-stream';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sass = gulpSass(dartSass);

// BrowserSync.
export const browserSyncServe = () => {
  return browserSync.init({
    server: 'public',
    watch: true,
  });
};

// Pug.
export const compilePug = () => {
  return gulp.src('src/pug/pages/*.pug')
    .pipe(pug({
      pretty: true,
    }))
    .pipe(gulp.dest('public'));
}

// Scss
export const compileScss = () => {
  return gulp.src('src/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postCss([
      autoprefixer(),
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('public'));
}

// Scss linting.
export const lintScss = () => {
  return gulp.src('src/scss/**/*.scss')
    .pipe(styleLint({
      reporters: [
        {
          formatter: 'string',
          console: true,
        }
      ]
    }));
}

// Js.
export const compileJs = () => {
  return gulp.src('src/js/index.js')
    .pipe(webpack({
      output: {
        filename: 'scripts.bundle.js',
        path: path.resolve(__dirname, 'public/js'),
      },
      mode: 'development',
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    }))
    .pipe(gulp.dest('public/js'))
}

// Compress images.
export const compressImages = () => {
  return gulp.src('src/images/*.+(jpg|jpeg|png|gif)')
    .pipe(imagemin())
    .pipe(gulp.dest('public/images'));
}

// Svg sprite.
export const generateSvgSprite = () => {
  return gulp.src('src/images/svg/sprite-icons/*.svg')
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest: '.',
          sprite: 'sprite.svg',
        },
      },
    }))
    .pipe(gulp.dest('public/images/svg'));
}

// Copying folders.
export const copyFolders = (folders, excludeFolders) => {
  const paths = [`src/+(${folders.join('|')})/**`];

  if (excludeFolders && excludeFolders.length) {
    excludeFolders.forEach(item => paths.push(`!src/${item}`));
  }

  const copyFolders = () =>  {
    return gulp.src(paths)
      .pipe(gulp.dest('public'));
  }

  return copyFolders;
};

// Remove folders.
export const removeFolders = folders => {
  const removeFolders = () => deleteAsync(folders);

  return removeFolders;
};

// Watcher.
export const watcher = () => {
  gulp.watch('src/pug/**/*.pug', compilePug);
  gulp.watch('src/scss/**/*.scss', gulp.series(lintScss, compileScss));
  gulp.watch('src/js/**/*.js', compileJs);
  gulp.watch('src/images/*.+(jpg|jpeg|png|gif)', { events: ['add', 'change'] }, compressImages);
  gulp.watch('src/images/svg/sprite-icons/*.svg', generateSvgSprite);
}

// Default.
export default gulp.series(
  removeFolders(['public']),
  lintScss,
  gulp.parallel(
    copyFolders(
      ['fonts', 'images'],
      ['images/svg/sprite-icons/**']
    ),
    compilePug,
    compileScss,
    compileJs,
    compressImages,
    generateSvgSprite,
  ),
  gulp.parallel(
    watcher,
    browserSyncServe
  )
);