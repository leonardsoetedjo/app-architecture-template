const Generator = require('yeoman-generator');
const chalk = require('chalk');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('usecase-name', {
      type: String,
      required: false,
      desc: 'Use case name (e.g., CreateOrder)'
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
        name: 'usecaseName',
        message: 'What is the use case name?',
        default: this.options['usecase-name'] || 'CreateOrder',
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
        type: 'confirm',
        name: 'addCommand',
        message: 'Add Command DTO?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addResult',
        message: 'Add Result DTO?',
        default: true
      }
    ]);

    this.answers = {
      ...answers,
      usecaseNamePascal: this._pascalCase(answers.usecaseName),
      usecaseNameCamel: this._camelCase(answers.usecaseName),
      usecaseNameKebab: this._kebabCase(answers.usecaseName),
      usecaseNameSnake: this._snakeCase(answers.usecaseName)
    };

    this.log(chalk.blue(`\n✨ Creating use case: ${this.answers.usecaseNamePascal}...`));
  }

  writing() {
    const { stack, usecaseNamePascal, usecaseNameCamel, usecaseNameKebab, usecaseNameSnake } = this.answers;

    if (stack === 'java') {
      this._writeJavaUsecase(usecaseNamePascal, usecaseNameCamel, usecaseNameKebab);
    } else {
      this._writePythonUsecase(usecaseNamePascal, usecaseNameCamel, usecaseNameKebab, usecaseNameSnake);
    }
  }

  _writeJavaUsecase(usecaseNamePascal, usecaseNameCamel, usecaseNameKebab) {
    const base = 'boilerplate/java/src/main/java/com/example/application';
    
    // Use case interface
    this._writeTemplate(
      `${base}/usecases/${usecaseNamePascal}UseCase.java`,
      'java/usecase-interface.java.ejs',
      { usecaseNamePascal, usecaseNameCamel }
    );

    // Use case implementation
    this._writeTemplate(
      `${base}/usecases/${usecaseNamePascal}UseCaseImpl.java`,
      'java/usecase-impl.java.ejs',
      { usecaseNamePascal, usecaseNameCamel }
    );

    // Command DTO
    if (this.answers.addCommand) {
      this._writeTemplate(
        `${base}/dtos/${usecaseNamePascal}Command.java`,
        'java/command.java.ejs',
        { usecaseNamePascal, usecaseNameCamel }
      );
    }

    // Result DTO
    if (this.answers.addResult) {
      this._writeTemplate(
        `${base}/dtos/${usecaseNamePascal}Result.java`,
        'java/result.java.ejs',
        { usecaseNamePascal, usecaseNameCamel }
      );
    }
  }

  _writePythonUsecase(usecaseNamePascal, usecaseNameCamel, usecaseNameKebab, usecaseNameSnake) {
    const base = 'boilerplate/python/src/application';
    
    // Use case
    this._writeTemplate(
      `${base}/usecases/${usecaseNameSnake}_usecase.py`,
      'python/usecase.py.ejs',
      { usecaseNamePascal, usecaseNameCamel, usecaseNameSnake }
    );

    // DTOs
    if (this.answers.addCommand || this.answers.addResult) {
      this._writeTemplate(
        `${base}/dtos/${usecaseNameSnake}_dtos.py`,
        'python/dtos.py.ejs',
        { usecaseNamePascal, usecaseNameCamel, usecaseNameSnake }
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

  end() {
    this.log(chalk.green('\n✅ Use case created successfully!'));
    this.log(chalk.blue('\n📝 Next steps:'));
    this.log('  1. Implement business logic in the use case');
    this.log('  2. Inject repository ports via constructor');
    this.log('  3. Add transaction boundaries');
    this.log('  4. Write unit tests');
  }
};
