const Generator = require('yeoman-generator');
const chalk = require('chalk');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('entity-name', {
      type: String,
      required: false,
      desc: 'Entity name (e.g., Order)'
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
        name: 'entityName',
        message: 'What is the entity name?',
        default: this.options['entity-name'] || 'Order',
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
        name: 'addValueObjects',
        message: 'Add value objects?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addDomainEvents',
        message: 'Add domain events?',
        default: false
      }
    ]);

    this.answers = {
      ...answers,
      entityNamePascal: this._pascalCase(answers.entityName),
      entityNameCamel: this._camelCase(answers.entityName),
      entityNameKebab: this._kebabCase(answers.entityName),
      entityNameSnake: this._snakeCase(answers.entityName)
    };

    this.log(chalk.blue(`\n✨ Creating entity: ${this.answers.entityNamePascal}...`));
  }

  writing() {
    const { stack, entityNamePascal, entityNameCamel, entityNameKebab, entityNameSnake } = this.answers;

    if (stack === 'java') {
      this._writeJavaEntity(entityNamePascal, entityNameCamel, entityNameKebab);
    } else {
      this._writePythonEntity(entityNamePascal, entityNameCamel, entityNameKebab, entityNameSnake);
    }
  }

  _writeJavaEntity(entityNamePascal, entityNameCamel, entityNameKebab) {
    const base = 'boilerplate/java/src/main/java/com/example/domain/models';
    
    // Entity
    this._writeTemplate(
      `${base}/${entityNamePascal}.java`,
      'java/entity.java.ejs',
      { entityNamePascal, entityNameCamel, entityNameKebab }
    );

    // Value Objects (optional)
    if (this.answers.addValueObjects) {
      const voBase = 'boilerplate/java/src/main/java/com/example/domain/valueobjects';
      this._writeTemplate(
        `${voBase}/${entityNamePascal}Id.java`,
        'java/value-object.java.ejs',
        { entityNamePascal, entityNameCamel, voName: `${entityNamePascal}Id`, voType: 'UUID' }
      );
    }

    // Domain Event (optional)
    if (this.answers.addDomainEvents) {
      const eventBase = 'boilerplate/java/src/main/java/com/example/domain/events';
      this._writeTemplate(
        `${eventBase}/${entityNamePascal}Created.java`,
        'java/domain-event.java.ejs',
        { entityNamePascal, entityNameCamel, eventName: `${entityNamePascal}Created` }
      );
    }
  }

  _writePythonEntity(entityNamePascal, entityNameCamel, entityNameKebab, entityNameSnake) {
    const base = 'boilerplate/python/src/domain/models';
    
    // Entity
    this._writeTemplate(
      `${base}/${entityNameSnake}.py`,
      'python/entity.py.ejs',
      { entityNamePascal, entityNameCamel, entityNameKebab, entityNameSnake }
    );

    // Value Objects (optional)
    if (this.answers.addValueObjects) {
      const voBase = 'boilerplate/python/src/domain/value_objects';
      this._writeTemplate(
        `${voBase}/${entityNameSnake}_id.py`,
        'python/value-object.py.ejs',
        { entityNamePascal, entityNameCamel, entityNameSnake, voName: `${entityNamePascal}Id` }
      );
    }

    // Domain Event (optional)
    if (this.answers.addDomainEvents) {
      const eventBase = 'boilerplate/python/src/domain/events';
      this._writeTemplate(
        `${eventBase}/${entityNameSnake}_created.py`,
        'python/domain-event.py.ejs',
        { entityNamePascal, entityNameCamel, entityNameSnake, eventName: `${entityNamePascal}Created` }
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
    this.log(chalk.green('\n✅ Entity created successfully!'));
    this.log(chalk.blue('\n📝 Next steps:'));
    this.log('  1. Add domain-specific fields to the entity');
    this.log('  2. Implement business logic methods');
    this.log('  3. Create repository port in domain/ports/');
    this.log('  4. Write unit tests');
  }
};
