const Generator = require('yeoman-generator');
const chalk = require('chalk');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('service-name', {
      type: String,
      required: false,
      desc: 'Service name (e.g., order-service, user-service)'
    });

    this.option('stack', {
      type: String,
      required: false,
      desc: 'Stack: java or python'
    });
  }

  async prompting() {
    const answers = await this.prompt([
      {
        type: 'input',
        name: 'serviceName',
        message: 'What is the service name?',
        default: this.options['service-name'] || 'order-service',
        store: true
      },
      {
        type: 'list',
        name: 'stack',
        message: 'Select stack:',
        choices: [
          { name: 'Java (Spring Boot 3.4+)', value: 'java' },
          { name: 'Python (FastAPI)', value: 'python' }
        ],
        default: this.options.stack || 'java'
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'Java package name (ignored for Python):',
        default: 'com.example',
        when: answers => answers.stack === 'java'
      },
      {
        type: 'confirm',
        name: 'addDockerfile',
        message: 'Add Dockerfile?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addDevContainer',
        message: 'Add .devcontainer configuration?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addGitHubActions',
        message: 'Add GitHub Actions CI/CD workflow?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addDocumentation',
        message: 'Add README and documentation?',
        default: true
      }
    ]);

    this.answers = {
      ...answers,
      serviceNameKebab: answers.serviceName.toLowerCase().replace(/\s+/g, '-'),
      serviceNameSnake: answers.serviceName.toLowerCase().replace(/[\s-]+/g, '_'),
      serviceNamePascal: answers.serviceName.replace(/(^|-)([a-z])/g, (match, _, letter) => letter.toUpperCase())
    };

    this.log(chalk.blue(`\n✨ Creating new microservice: ${this.answers.serviceNamePascal}...`));
    this.log(chalk.blue(`   Stack: ${answers.stack === 'java' ? 'Java/Spring Boot' : 'Python/FastAPI'}`));
  }

  writing() {
    const { stack, serviceNameKebab, serviceNameSnake, serviceNamePascal } = this.answers;

    if (stack === 'java') {
      this._createJavaService(serviceNameKebab, serviceNamePascal);
    } else {
      this._createPythonService(serviceNameKebab, serviceNameSnake, serviceNamePascal);
    }

    if (this.answers.addDockerfile) {
      this._createDockerfile(stack, serviceNameKebab);
    }

    if (this.answers.addDevContainer) {
      this._createDevContainer(stack);
    }

    if (this.answers.addGitHubActions) {
      this._createGitHubActions(stack, serviceNameKebab);
    }

    if (this.answers.addDocumentation) {
      this._createDocumentation(serviceNameKebab, serviceNamePascal, stack);
    }
  }

  _createJavaService(serviceNameKebab, serviceNamePascal) {
    const base = `boilerplate/java/${serviceNameKebab}`;
    const packagePath = this.answers.packageName.replace(/\./g, '/');

    this.log(chalk.green('\n📁 Creating Java/Spring Boot service structure...'));

    // Create directory structure
    const directories = [
      `${base}/src/main/java/${packagePath}`,
      `${base}/src/main/resources/db/migration`,
      `${base}/src/test/java/${packagePath}`,
      `${base}/.devcontainer`,
      `${base}/.github/workflows`
    ];

    directories.forEach(dir => this.fs.write(this.destinationPath(`${dir}/.gitkeep`), ''));

    // Create pom.xml
    this._writeTemplate(
      `${base}/pom.xml`,
      'java/app/pom.xml.ejs',
      { serviceNameKebab, serviceNamePascal, packageName: this.answers.packageName }
    );

    // Create main application class
    this._writeTemplate(
      `${base}/src/main/java/${packagePath}/${serviceNamePascal}Application.java`,
      'java/app/application.java.ejs',
      { serviceNamePascal, packageName: this.answers.packageName }
    );

    // Create application.yml
    this._writeTemplate(
      `${base}/src/main/resources/application.yml`,
      'java/app/application.yml.ejs',
      { serviceNameKebab, packageName: this.answers.packageName }
    );

    // Create .gitignore
    this._writeTemplate(
      `${base}/.gitignore`,
      'java/app/gitignore.ejs',
      {}
    );

    this.log(chalk.green(`   Created ${base}/`));
  }

  _createPythonService(serviceNameKebab, serviceNameSnake, serviceNamePascal) {
    const base = `boilerplate/python/${serviceNameKebab}`;

    this.log(chalk.green('\n📁 Creating Python/FastAPI service structure...'));

    // Create directory structure
    const directories = [
      `${base}/src/domain/models`,
      `${base}/src/domain/ports`,
      `${base}/src/application/usecases`,
      `${base}/src/application/dtos`,
      `${base}/src/infrastructure/api`,
      `${base}/src/infrastructure/persistence`,
      `${base}/src/infrastructure/config`,
      `${base}/tests/domain`,
      `${base}/tests/application`,
      `${base}/tests/infrastructure`,
      `${base}/.devcontainer`,
      `${base}/.github/workflows`,
      `${base}/alembic/versions`
    ];

    directories.forEach(dir => this.fs.write(this.destinationPath(`${dir}/.gitkeep`), ''));

    // Create pyproject.toml
    this._writeTemplate(
      `${base}/pyproject.toml`,
      'python/app/pyproject.toml.ejs',
      { serviceNameKebab, serviceNamePascal }
    );

    // Create main.py
    this._writeTemplate(
      `${base}/src/main.py`,
      'python/app/main.py.ejs',
      { serviceNamePascal, serviceNameSnake }
    );

    // Create config.py
    this._writeTemplate(
      `${base}/src/infrastructure/config/settings.py`,
      'python/app/settings.py.ejs',
      { serviceNamePascal, serviceNameSnake }
    );

    // Create alembic.ini
    this._writeTemplate(
      `${base}/alembic.ini`,
      'python/app/alembic.ini.ejs',
      { serviceNameSnake }
    );

    // Create .gitignore
    this._writeTemplate(
      `${base}/.gitignore`,
      'python/app/gitignore.ejs',
      {}
    );

    this.log(chalk.green(`   Created ${base}/`));
  }

  _createDockerfile(stack, serviceNameKebab) {
    this.log(chalk.green('\n🐳 Creating Dockerfile...'));

    if (stack === 'java') {
      this._writeTemplate(
        `boilerplate/java/${serviceNameKebab}/Dockerfile`,
        'java/app/Dockerfile.ejs',
        { serviceNameKebab }
      );
    } else {
      this._writeTemplate(
        `boilerplate/python/${serviceNameKebab}/Dockerfile`,
        'python/app/Dockerfile.ejs',
        { serviceNameKebab }
      );
    }
  }

  _createDevContainer(stack) {
    this.log(chalk.green('\n💻 Creating .devcontainer configuration...'));

    if (stack === 'java') {
      this._writeTemplate(
        `boilerplate/java/${this.answers.serviceNameKebab}/.devcontainer/devcontainer.json`,
        'java/app/devcontainer.json.ejs',
        {}
      );
    } else {
      this._writeTemplate(
        `boilerplate/python/${this.answers.serviceNameKebab}/.devcontainer/devcontainer.json`,
        'python/app/devcontainer.json.ejs',
        {}
      );
    }
  }

  _createGitHubActions(stack, serviceNameKebab) {
    this.log(chalk.green('\n🔄 Creating GitHub Actions workflow...'));

    this._writeTemplate(
      `boilerplate/${stack}/${serviceNameKebab}/.github/workflows/ci.yml`,
      stack === 'java' ? 'java/app/ci.yml.ejs' : 'python/app/ci.yml.ejs',
      { serviceNameKebab, stack }
    );
  }

  _createDocumentation(serviceNameKebab, serviceNamePascal, stack) {
    this.log(chalk.green('\n📚 Creating documentation...'));

    this._writeTemplate(
      `boilerplate/${stack}/${serviceNameKebab}/README.md`,
      stack === 'java' ? 'java/app/README.md.ejs' : 'python/app/README.md.ejs',
      { serviceNameKebab, serviceNamePascal, stack }
    );
  }

  _writeTemplate(dest, templatePath, context) {
    try {
      const template = this.fs.read(this.templatePath(templatePath));
      const compiled = this.engine(template, context);
      this.fs.write(dest, compiled);
      this.log(chalk.green(`  create ${dest}`));
    } catch (err) {
      this.log(chalk.yellow(`  skip ${dest} (template not found: ${templatePath})`));
    }
  }

  install() {
    const { stack, serviceNameKebab } = this.answers;
    const base = `boilerplate/${stack}/${serviceNameKebab}`;

    this.log(chalk.blue('\n📦 Installing dependencies...'));

    if (stack === 'java') {
      this.log(chalk.yellow('   Run: cd ' + base + ' && ./mvnw clean install'));
    } else {
      this.log(chalk.yellow('   Run: cd ' + base + ' && poetry install'));
    }
  }

  end() {
    const { stack, serviceNameKebab, serviceNamePascal } = this.answers;
    const base = `boilerplate/${stack}/${serviceNameKebab}`;

    this.log(chalk.green('\n✅ Service scaffolded successfully!'));
    this.log(chalk.blue('\n📝 Next steps:'));
    this.log(`  1. cd ${base}`);
    if (stack === 'java') {
      this.log('  2. ./mvnw clean install');
      this.log('  3. ./mvnw spring-boot:run');
    } else {
      this.log('  2. poetry install');
      this.log('  3. poetry run uvicorn src.main:app --reload');
    }
    this.log('  4. Implement your first feature with: yo clean-architecture:endpoint');
    this.log('  5. Commit with architecture evidence');
  }
};
