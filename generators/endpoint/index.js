const Generator = require('yeoman-generator');
const chalk = require('chalk');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('stack', {
      type: String,
      required: false,
      desc: 'Stack: java or python'
    });

    this.option('feature-name', {
      type: String,
      required: false,
      desc: 'Feature name (e.g., CreateOrder)'
    });

    this.option('endpoint-type', {
      type: String,
      required: false,
      desc: 'Endpoint type: POST, GET, PUT, PATCH, DELETE'
    });
  }

  async prompting() {
    const answers = await this.prompt([
      {
        type: 'input',
        name: 'featureName',
        message: 'What is the feature name?',
        default: this.options['feature-name'] || 'CreateOrder',
        store: true
      },
      {
        type: 'list',
        name: 'stack',
        message: 'Select stack:',
        choices: [
          { name: 'Java (Spring Boot)', value: 'java' },
          { name: 'Python (FastAPI)', value: 'python' }
        ],
        default: this.options.stack || 'java'
      },
      {
        type: 'list',
        name: 'endpointType',
        message: 'What type of endpoint?',
        choices: [
          { name: 'POST (Create resource)', value: 'POST' },
          { name: 'GET (Get resource)', value: 'GET' },
          { name: 'PUT (Update resource)', value: 'PUT' },
          { name: 'PATCH (Partial update)', value: 'PATCH' },
          { name: 'DELETE (Delete resource)', value: 'DELETE' }
        ],
        default: this.options['endpoint-type'] || 'POST'
      },
      {
        type: 'confirm',
        name: 'hasDomainEvents',
        message: 'Has domain events?',
        default: false
      },
      {
        type: 'confirm',
        name: 'hasExternalApiCalls',
        message: 'Has external API calls?',
        default: false
      },
      {
        type: 'confirm',
        name: 'hasFileUploads',
        message: 'Has file uploads?',
        default: false
      },
      {
        type: 'confirm',
        name: 'addTests',
        message: 'Add tests?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addOpenApi',
        message: 'Add OpenAPI documentation?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addMigration',
        message: 'Add database migration?',
        default: true
      }
    ]);

    this.answers = {
      ...answers,
      featureNamePascal: this._pascalCase(answers.featureName),
      featureNameCamel: this._camelCase(answers.featureName),
      featureNameKebab: this._kebabCase(answers.featureName),
      featureNameSnake: this._snakeCase(answers.featureName),
      entityName: this._extractEntityName(answers.featureName)
    };

    this.log(chalk.blue(`\n✨ Creating feature: ${this.answers.featureNamePascal}...`));
  }

  writing() {
    const { stack, featureNamePascal, featureNameCamel, featureNameKebab, featureNameSnake, entityName } = this.answers;

    if (stack === 'java') {
      this._writeJavaFiles(featureNamePascal, featureNameCamel, featureNameKebab, entityName);
    } else {
      this._writePythonFiles(featureNamePascal, featureNameCamel, featureNameKebab, featureNameSnake, entityName);
    }
  }

  _writeJavaFiles(featureNamePascal, featureNameCamel, featureNameKebab, entityName) {
    const base = 'boilerplate/java/src/main/java/com/example';
    const testBase = 'boilerplate/java/src/test/java/com/example';

    // Domain layer
    this._writeTemplate(
      `${base}/domain/models/${entityName}.java`,
      'java/domain/entity.java.ejs',
      { entityName, featureNamePascal }
    );

    this._writeTemplate(
      `${base}/domain/ports/${entityName}Repository.java`,
      'java/domain/repository.java.ejs',
      { entityName, featureNamePascal }
    );

    // Application layer
    this._writeTemplate(
      `${base}/application/usecases/${featureNamePascal}UseCase.java`,
      'java/application/usecase.java.ejs',
      { featureNamePascal, entityName }
    );

    this._writeTemplate(
      `${base}/application/dtos/${featureNamePascal}Command.java`,
      'java/application/command.java.ejs',
      { featureNamePascal, entityName }
    );

    this._writeTemplate(
      `${base}/application/dtos/${featureNamePascal}Result.java`,
      'java/application/result.java.ejs',
      { featureNamePascal, entityName }
    );

    // Infrastructure layer
    this._writeTemplate(
      `${base}/infrastructure/api/${entityName}Controller.java`,
      'java/infrastructure/controller.java.ejs',
      { entityName, featureNamePascal, featureNameCamel, answers: this.answers }
    );

    this._writeTemplate(
      `${base}/infrastructure/persistence/${entityName}RepositoryImpl.java`,
      'java/infrastructure/repository-impl.java.ejs',
      { entityName, featureNamePascal }
    );

    // Tests
    if (this.answers.addTests) {
      this._writeTemplate(
        `${testBase}/domain/${entityName}Test.java`,
        'java/test/domain-test.java.ejs',
        { entityName, featureNamePascal }
      );

      this._writeTemplate(
        `${testBase}/application/${featureNamePascal}UseCaseTest.java`,
        'java/test/usecase-test.java.ejs',
        { featureNamePascal, entityName }
      );

      this._writeTemplate(
        `${testBase}/infrastructure/${entityName}ControllerTest.java`,
        'java/test/controller-test.java.ejs',
        { entityName, featureNamePascal }
      );
    }
  }

  _writePythonFiles(featureNamePascal, featureNameCamel, featureNameKebab, featureNameSnake, entityName) {
    const base = 'boilerplate/python/src';

    // Domain layer
    this._writeTemplate(
      `${base}/domain/models/${featureNameSnake}.py`,
      'python/domain/entity.py.ejs',
      { entityName, featureNamePascal, featureNameSnake, featureNameCamel }
    );

    this._writeTemplate(
      `${base}/domain/ports/${featureNameSnake}_repository.py`,
      'python/domain/repository.py.ejs',
      { featureNamePascal, featureNameSnake, featureNameCamel, entityName }
    );

    // Application layer
    this._writeTemplate(
      `${base}/application/usecases/${featureNameSnake}_usecase.py`,
      'python/application/usecase.py.ejs',
      { featureNamePascal, featureNameSnake, featureNameCamel, entityName }
    );

    this._writeTemplate(
      `${base}/application/dtos/${featureNameSnake}_dtos.py`,
      'python/application/dtos.py.ejs',
      { featureNamePascal, featureNameSnake, featureNameCamel, entityName }
    );

    // Infrastructure layer
    this._writeTemplate(
      `${base}/infrastructure/api/${featureNameSnake}_router.py`,
      'python/infrastructure/router.py.ejs',
      { featureNamePascal, featureNameSnake, featureNameCamel, entityName, answers: this.answers }
    );

    this._writeTemplate(
      `${base}/infrastructure/persistence/${featureNameSnake}_repository.py`,
      'python/infrastructure/repository.py.ejs',
      { featureNamePascal, featureNameSnake, featureNameCamel, entityName }
    );

    // Tests
    if (this.answers.addTests) {
      this._writeTemplate(
        `boilerplate/python/tests/domain/test_${featureNameSnake}.py`,
        'python/test/domain-test.py.ejs',
        { featureNamePascal, featureNameSnake, entityName }
      );

      this._writeTemplate(
        `boilerplate/python/tests/application/test_${featureNameSnake}_usecase.py`,
        'python/test/usecase-test.py.ejs',
        { featureNamePascal, featureNameSnake, entityName }
      );

      this._writeTemplate(
        `boilerplate/python/tests/infrastructure/test_${featureNameSnake}_router.py`,
        'python/test/router-test.py.ejs',
        { featureNamePascal, featureNameSnake, entityName }
      );
    }
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

  _pascalCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s_-]+/g, '_')
      .toUpperCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  _camelCase(str) {
    const pascal = this._pascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  _kebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  _snakeCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  _extractEntityName(featureName) {
    // Remove common prefixes
    const prefixes = ['Create', 'Get', 'Update', 'Delete', 'List', 'Find'];
    let name = featureName;
    for (const prefix of prefixes) {
      if (name.startsWith(prefix)) {
        name = name.slice(prefix.length);
        break;
      }
    }
    // Singularize (simple heuristic)
    if (name.endsWith('s')) {
      name = name.slice(0, -1);
    }
    return name || 'Entity';
  }

  end() {
    this.log(chalk.green('\n✅ Feature scaffolded successfully!'));
    this.log(chalk.blue('\n📝 Next steps:'));
    this.log('  1. Review generated files');
    this.log(`  2. Implement business logic in use case`);
    this.log(`  3. Run: ${this.answers.stack === 'java' ? 'mvn test' : 'pytest'}`);
    this.log('  4. Commit with architecture evidence');
  }
};
