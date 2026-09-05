import { GruntTaskPreset } from '../types';

export const SAMPLE_TASKS: GruntTaskPreset[] = [
  {
    id: 'build_prod',
    name: 'Production Build Pipeline',
    description: 'Full compilation including clean, eslint, sass, terser minification, and asset bundling.',
    command: 'grunt build:prod',
    logs: [
      { type: 'subhead', message: 'Running "clean:dist" (clean) task', task: 'clean:dist' },
      { type: 'writeln', message: '>> Cleaning "dist" directory...', task: 'clean:dist' },
      { type: 'writeln', message: '>> Removed 142 stale files from dist/', task: 'clean:dist' },
      { type: 'ok', message: 'Task "clean:dist" completed successfully.', task: 'clean:dist' },

      { type: 'subhead', message: 'Running "eslint:source" (eslint) task', task: 'eslint:source' },
      { type: 'writeln', message: '>> Scanning 87 JavaScript/TypeScript modules...', task: 'eslint:source' },
      { type: 'debug', message: 'AST cache hit: 85/87 files validated from memory', task: 'eslint:source' },
      { type: 'warn', message: 'Warning: variable "legacyShim" is declared but never used (src/utils.js:42:7)', task: 'eslint:source' },
      { type: 'ok', message: '87 files lint-checked. 0 errors, 1 warning.', task: 'eslint:source' },

      { type: 'subhead', message: 'Running "sass:compile" (sass) task', task: 'sass:compile' },
      { type: 'writeln', message: '>> Compiling scss/main.scss -> dist/css/bundle.css', task: 'sass:compile' },
      { type: 'writeln', message: '>> Autoprefixer applied prefixes for 12 vendor properties', task: 'sass:compile' },
      { type: 'ok', message: 'File "dist/css/bundle.css" created (48.3 KB).', task: 'sass:compile' },

      { type: 'subhead', message: 'Running "terser:minify" (terser) task', task: 'terser:minify' },
      { type: 'writeln', message: '>> Bundling 34 internal chunks into bundle.min.js...', task: 'terser:minify' },
      { type: 'verbose', message: 'Uglify compressor iteration 1: dead-code elimination (14 nodes pruned)', task: 'terser:minify' },
      { type: 'verbose', message: 'Uglify compressor iteration 2: mangle property names (1,230 identifiers)', task: 'terser:minify' },
      { type: 'writeln', message: '>> Source map generated at dist/js/bundle.min.js.map', task: 'terser:minify' },
      { type: 'ok', message: 'File "dist/js/bundle.min.js" created (184.2 KB -> 42.1 KB gzip).', task: 'terser:minify' },

      { type: 'subhead', message: 'Running "copy:assets" (copy) task', task: 'copy:assets' },
      { type: 'writeln', message: '>> Copying public/icons -> dist/icons (24 assets)', task: 'copy:assets' },
      { type: 'writeln', message: '>> Copying public/manifest.json -> dist/manifest.json', task: 'copy:assets' },
      { type: 'ok', message: 'Copied 25 asset files to dist directory.', task: 'copy:assets' },

      { type: 'subhead', message: 'Running "vexorion:summary" task', task: 'vexorion:summary' },
      { type: 'ok', message: 'Done, without errors. Production build ready in 2.84s.', task: 'build:prod' }
    ]
  },
  {
    id: 'test_ci',
    name: 'CI Unit & Integration Tests',
    description: 'Running mocha test suites with nyc coverage and regression verification.',
    command: 'grunt test:ci',
    logs: [
      { type: 'subhead', message: 'Running "mocha:unit" (mocha) task', task: 'mocha:unit' },
      { type: 'writeln', message: '>> Initializing V8 test harness...', task: 'mocha:unit' },
      { type: 'writeln', message: '   ✓ Config class handles default options correctly (12ms)', task: 'mocha:unit' },
      { type: 'writeln', message: '   ✓ Config validateOptions rejects non-string arrays (8ms)', task: 'mocha:unit' },
      { type: 'writeln', message: '   ✓ Logger hooks into grunt.log methods seamlessly (15ms)', task: 'mocha:unit' },
      { type: 'writeln', message: '   ✓ Vexorion event listener emits typeAdded upon addition (6ms)', task: 'mocha:unit' },
      { type: 'writeln', message: '   ✓ LRU Cache evicts oldest 25% entries at 1000 items (21ms)', task: 'mocha:unit' },
      { type: 'ok', message: '5 tests passed in 62ms.', task: 'mocha:unit' },

      { type: 'subhead', message: 'Running "nyc:coverage" (nyc) task', task: 'nyc:coverage' },
      { type: 'writeln', message: '-----------------------|---------|----------|---------|---------|', task: 'nyc:coverage' },
      { type: 'writeln', message: 'File                   | % Stmts | % Branch | % Funcs | % Lines |', task: 'nyc:coverage' },
      { type: 'writeln', message: '-----------------------|---------|----------|---------|---------|', task: 'nyc:coverage' },
      { type: 'writeln', message: ' lib/vexorion.js       |   98.21 |    94.12 |   100.0 |   98.15 |', task: 'nyc:coverage' },
      { type: 'writeln', message: ' lib/config.js         |   97.80 |    92.86 |   100.0 |   97.73 |', task: 'nyc:coverage' },
      { type: 'writeln', message: ' lib/logger.js         |   96.43 |    89.47 |   100.0 |   96.30 |', task: 'nyc:coverage' },
      { type: 'writeln', message: '-----------------------|---------|----------|---------|---------|', task: 'nyc:coverage' },
      { type: 'ok', message: 'All coverage thresholds (>95%) met successfully.', task: 'nyc:coverage' },

      { type: 'subhead', message: 'Running "audit:dependencies" task', task: 'audit:dependencies' },
      { type: 'warn', message: 'Notice: 2 dev dependencies have newer minor releases available.', task: 'audit:dependencies' },
      { type: 'ok', message: '0 vulnerabilities found across 314 packages.', task: 'audit:dependencies' }
    ]
  },
  {
    id: 'deploy_staging',
    name: 'Deploy to Staging Server',
    description: 'Docker image build, push to registry, and rolling container restart with health checks.',
    command: 'grunt deploy:staging',
    logs: [
      { type: 'subhead', message: 'Running "git:verify_branch" task', task: 'git:verify_branch' },
      { type: 'writeln', message: '>> Current branch is "release/v2.1.0" (commit a8f93e1)', task: 'git:verify_branch' },
      { type: 'ok', message: 'Working directory clean. Tag verified.', task: 'git:verify_branch' },

      { type: 'subhead', message: 'Running "docker:build" task', task: 'docker:build' },
      { type: 'verbose', message: 'Step 1/8 : FROM node:22-alpine', task: 'docker:build' },
      { type: 'verbose', message: 'Step 2/8 : WORKDIR /app', task: 'docker:build' },
      { type: 'verbose', message: 'Step 3/8 : COPY package*.json ./', task: 'docker:build' },
      { type: 'verbose', message: 'Step 4/8 : RUN npm ci --only=production', task: 'docker:build' },
      { type: 'writeln', message: '>> Successfully built image tag: registry.internal/app:v2.1.0', task: 'docker:build' },
      { type: 'ok', message: 'Docker image compiled in 14.1s.', task: 'docker:build' },

      { type: 'subhead', message: 'Running "k8s:rollout" task', task: 'k8s:rollout' },
      { type: 'writeln', message: '>> Updating deployment app-staging with image tag v2.1.0...', task: 'k8s:rollout' },
      { type: 'debug', message: 'Replica 1 of 3: terminating old pod app-staging-7f9d8c-1', task: 'k8s:rollout' },
      { type: 'debug', message: 'Replica 1 of 3: new pod app-staging-2a4b6c-1 healthy (HTTP 200 /health)', task: 'k8s:rollout' },
      { type: 'security', message: '[SECURITY EXCEPTION] TLS certificate verified for staging.internal domain', task: 'k8s:rollout' },
      { type: 'ok', message: 'Deployment app-staging updated successfully. 3/3 pods active.', task: 'k8s:rollout' }
    ]
  },
  {
    id: 'failing_pipeline',
    name: 'Build with Warning & Failure',
    description: 'Shows how Vexorion suppresses noisy chatter while instantly letting warnings and fatal errors break through!',
    command: 'grunt compile:strict',
    logs: [
      { type: 'subhead', message: 'Running "typescript:compile" (ts) task', task: 'typescript:compile' },
      { type: 'writeln', message: '>> Parsing tsconfig.json...', task: 'typescript:compile' },
      { type: 'writeln', message: '>> Loading 24 referenced declarations from node_modules...', task: 'typescript:compile' },
      { type: 'debug', message: 'Typecheck worker thread 1 started', task: 'typescript:compile' },
      { type: 'debug', message: 'Typecheck worker thread 2 started', task: 'typescript:compile' },
      { type: 'warn', message: 'src/compat.ts:18:5 - warning TS2345: Argument of type "null" is not assignable to parameter of type "string".', task: 'typescript:compile' },
      { type: 'error', message: 'Fatal error: src/index.ts:102:1 - error TS2304: Cannot find name "processShim".', task: 'typescript:compile' },
      { type: 'writeln', message: '>> TypeScript compilation terminated with 1 error, 1 warning.', task: 'typescript:compile' },
      { type: 'fail', message: 'Fatal error: Task "typescript:compile" failed with exit code 1.', task: 'typescript:compile' }
    ]
  }
];
