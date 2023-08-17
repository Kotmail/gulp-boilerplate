import gulp from 'gulp';
import pug from 'gulp-pug';
import browserSync from 'browser-sync';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import postCss from 'gulp-postcss';
import csso from 'postcss-csso';
import combineMq from 'postcss-combine-media-query';
import autoprefixer from 'autoprefixer';
import styleLint from 'gulp-stylelint-esm'
import { deleteAsync } from 'del';
import imagemin from 'gulp-imagemin';
import svgSprite from 'gulp-svg-sprite';
import webpack from 'webpack-stream';
import path from 'path';
import {fileURLToPath} from 'url';
import cacheBust from 'gulp-cache-bust';
import rename from 'gulp-rename';

const PATHS = {
  pug: 'src/pug/pages/*.pug',
  scss: 'src/scss/*.scss',
  js: 'src/js/index.js',
  img: 'src/images/*.+(jpg|jpeg|png|gif)',
  svg: 'src/images/svg/sprite-icons/*.svg',
  watcher: {
    pug: 'src/pug/**/*.pug',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    img: 'src/images/*.+(jpg|jpeg|png|gif)',
    svg: 'src/images/svg/sprite-icons/*.svg',
  },
  publicFolder: 'public',
  buildFolder: 'build',
};

const MODE = process.env.NODE_ENV || 'development';
const DEST_FOLDER = MODE === 'development' ? PATHS.publicFolder : PATHS.buildFolder;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sass = gulpSass(dartSass);

// BrowserSync.
export const browserSyncServe = () => {
  return browserSync.init({
    server: PATHS.publicFolder,
    watch: true,
  });
}

// Pug.
export const compilePug = () => {
  return gulp.src(PATHS.pug)
    .pipe(pug({
      pretty: true,
      data: {
        isDevelopmentMode: MODE === 'development',
      },
    }))
    .pipe(gulp.dest(DEST_FOLDER));
}

// Scss
export const compileScss = () => {
  if (MODE === 'production') {
    return gulp.src(PATHS.scss)
      .pipe(sass().on('error', sass.logError))
      .pipe(postCss([
        autoprefixer(),
        csso(),
        combineMq(),
      ]))
      .pipe(rename('style.min.css'))
      .pipe(gulp.dest(DEST_FOLDER));
  }

  return gulp.src(PATHS.scss)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postCss([
      autoprefixer(),
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DEST_FOLDER));
}

// Scss linting.
export const lintScss = () => {
  return gulp.src(PATHS.watcher.scss)
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
  return gulp.src(PATHS.js)
    .pipe(webpack({
      output: {
        filename: MODE === 'development' ? 'scripts.bundle.js' : 'scripts.bundle.min.js',
        path: path.resolve(__dirname, `${DEST_FOLDER}/js`),
      },
      mode: MODE,
      devtool: MODE === 'development' ? 'source-map' : false,
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
    .pipe(gulp.dest(`${DEST_FOLDER}/js`))
}

// Compress images.
export const compressImages = () => {
  return gulp.src(PATHS.img)
    .pipe(imagemin())
    .pipe(gulp.dest(`${DEST_FOLDER}/images`));
}

// Svg sprite.
export const generateSvgSprite = () => {
  return gulp.src(PATHS.svg)
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest: '.',
          sprite: 'sprite.svg',
        },
      },
    }))
    .pipe(gulp.dest(`${DEST_FOLDER}/images/svg`));
}

// Cache busting.
export const bustCache = () => {
  return gulp.src(`${DEST_FOLDER}/**/*.html`)
      .pipe(cacheBust())
      .pipe(gulp.dest(DEST_FOLDER));
}

// Copying folders.
export const copyFolders = (folders, excludeFolders) => {
  const paths = [`src/+(${folders.join('|')})/**`];

  if (excludeFolders && excludeFolders.length) {
    excludeFolders.forEach(item => paths.push(`!src/${item}`));
  }

  const copyFolders = () =>  {
    return gulp.src(paths)
      .pipe(gulp.dest(DEST_FOLDER));
  }

  return copyFolders;
}

// Remove folders.
export const removeFolders = folders => {
  const removeFolders = () => deleteAsync(folders);

  return removeFolders;
}

// Watcher.
export const watcher = () => {
  gulp.watch(PATHS.watcher.pug, compilePug);
  gulp.watch(PATHS.watcher.scss, gulp.series(lintScss, compileScss));
  gulp.watch(PATHS.watcher.js, compileJs);
  gulp.watch(PATHS.watcher.img, { events: ['add', 'change'] }, compressImages);
  gulp.watch(PATHS.watcher.svg, generateSvgSprite);
}

// Build.
export const build = gulp.series(
  removeFolders([PATHS.buildFolder]),
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
    generateSvgSprite
  ),
  bustCache
);

// Default.
export default gulp.series(
  removeFolders([PATHS.publicFolder, PATHS.buildFolder]),
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