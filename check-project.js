const fs = require('fs');
const path = require('path');

console.log('=== STP 项目验证检查 ===\n');

const requiredFiles = [
  'package.json',
  'README.md',
  'tsconfig.json',
  'jest.config.js',
  '.gitignore',
  'src/index.ts',
  'src/core/types.ts',
  'src/three-departments/secretariat.ts',
  'src/three-departments/chancellery.ts',
  'src/three-departments/state-affairs.ts',
  'src/six-ministries/personnel.ts',
  'src/six-ministries/revenue.ts',
  'src/six-ministries/rites.ts',
  'src/six-ministries/war.ts',
  'src/six-ministries/justice.ts',
  'src/six-ministries/works.ts',
  'tests/stp.test.ts',
  'examples/basic-usage.ts',
  'deploy.bat',
  'DEPLOYMENT.md'
];

const requiredDirs = [
  'src',
  'src/core',
  'src/three-departments',
  'src/six-ministries',
  'tests',
  'examples',
  'docs'
];

console.log('检查必需文件:');
let allFilesOk = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesOk = false;
});

console.log('\n检查必需目录:');
let allDirsOk = true;
requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
  if (!exists) allDirsOk = false;
});

console.log('\n检查 node_modules:');
const hasNodeModules = fs.existsSync('node_modules');
console.log(`  ${hasNodeModules ? '✅' : '⚠️'} node_modules/ ${hasNodeModules ? '(已安装)' : '(未安装，运行: npm install)'}`);

console.log('\n检查 package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  ✅ package.json 有效`);
  console.log(`    名称: ${pkg.name}`);
  console.log(`    版本: ${pkg.version}`);
  console.log(`    描述: ${pkg.description}`);
} catch (error) {
  console.log(`  ❌ package.json 无效: ${error.message}`);
  allFilesOk = false;
}

console.log('\n检查 TypeScript 配置:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log(`  ✅ tsconfig.json 有效`);
  console.log(`    目标: ${tsconfig.compilerOptions.target}`);
  console.log(`    输出目录: ${tsconfig.compilerOptions.outDir}`);
} catch (error) {
  console.log(`  ❌ tsconfig.json 无效: ${error.message}`);
  allFilesOk = false;
}

console.log('\n=== 检查结果 ===');
if (allFilesOk && allDirsOk) {
  console.log('✅ 所有必需文件和目录都存在');
  console.log('\n下一步:');
  console.log('1. 运行: npm install (如果未安装依赖)');
  console.log('2. 运行: deploy.bat 部署到 GitHub');
  console.log('3. 或参考 DEPLOYMENT.md 中的部署指南');
} else {
  console.log('❌ 缺少一些必需文件或目录');
  console.log('请确保所有必需文件都存在后再部署。');
}

console.log('\n=== 项目统计 ===');
function countFiles(dir) {
  let count = 0;
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        count += countFiles(fullPath);
      } else if (stat.isFile()) {
        count++;
      }
    });
  }
  return count;
}

console.log(`源代码文件: ${countFiles('src')} 个文件`);
console.log(`测试文件: ${countFiles('tests')} 个文件`);
console.log(`示例文件: ${countFiles('examples')} 个文件`);
console.log(`文档文件: ${countFiles('docs')} 个文件`);
console.log(`总文件数: ${countFiles('.')} 个文件和目录`);

process.exit(allFilesOk && allDirsOk ? 0 : 1);