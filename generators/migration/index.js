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

    this.option('migration-name', {
      type: String,
      required: false,
      desc: 'Migration name (e.g., create_orders_table)'
    });
  }

  async prompting() {
    const answers = await this.prompt([
      {
        type: 'input',
        name: 'migrationName',
        message: 'What is the migration name?',
        default: this.options['migration-name'] || 'create_orders_table',
        store: true
      },
      {
        type: 'list',
        name: 'stack',
        message: 'Select stack:',
        choices: [
          { name: 'Java (Flyway)', value: 'java' },
          { name: 'Python (Alembic)', value: 'python' }
        ],
        default: this.options.stack || 'java'
      },
      {
        type: 'input',
        name: 'tableName',
        message: 'Table name:',
        default: (answers) => answers.migrationName.replace('create_', '').replace('_table', ''),
        store: true
      }
    ]);

    this.answers = {
      ...answers,
      migrationNamePascal: this._pascalCase(answers.migrationName),
      migrationNameCamel: this._camelCase(answers.migrationName),
      timestamp: this._generateTimestamp()
    };

    this.log(chalk.blue(`\n✨ Creating migration: ${this.answers.migrationName}...`));
  }

  writing() {
    const { stack, migrationName, migrationNamePascal, migrationNameCamel, tableName, timestamp } = this.answers;

    if (stack === 'java') {
      this._writeFlywayMigration(migrationName, migrationNamePascal, tableName, timestamp);
    } else {
      this._writeAlembicMigration(migrationName, migrationNameCamel, tableName, timestamp);
    }
  }

  _writeFlywayMigration(migrationName, migrationNamePascal, tableName, timestamp) {
    const version = timestamp;
    const filename = `V${version}__${migrationName}.sql`;
    const dest = `boilerplate/java/src/main/resources/db/migration/${filename}`;

    const content = `-- Migration: ${migrationName}
-- Version: ${version}
-- Description: Create ${tableName} table

CREATE TABLE IF NOT EXISTS ${tableName} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Add domain-specific columns here
    -- name VARCHAR(255) NOT NULL,
    -- amount DECIMAL(19, 4) NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_${tableName}_created_at CHECK (created_at <= updated_at)
);

-- Indexes
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at DESC);
CREATE INDEX idx_${tableName}_updated_at ON ${tableName}(updated_at DESC);

-- Comments
COMMENT ON TABLE ${tableName} IS '${migrationNamePascal} aggregate root table';
COMMENT ON COLUMN ${tableName}.id IS 'Unique identifier';
COMMENT ON COLUMN ${tableName}.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN ${tableName}.updated_at IS 'Record last update timestamp';

-- Rollback (for reference - Flyway doesn't execute this automatically)
-- DROP TABLE IF EXISTS ${tableName} CASCADE;
`;

    this.fs.write(dest, content);
    this.log(chalk.green(`  create ${dest}`));

    // Create rollback script
    const rollbackDest = `boilerplate/java/src/main/resources/db/rollback/V${version}__${migrationName}_rollback.sql`;
    const rollbackContent = `-- Rollback: ${migrationName}
-- Version: ${version}

DROP TABLE IF EXISTS ${tableName} CASCADE;
`;

    this.fs.write(rollbackDest, rollbackContent);
    this.log(chalk.green(`  create ${rollbackDest}`));
  }

  _writeAlembicMigration(migrationName, migrationNameCamel, tableName, timestamp) {
    const revision = timestamp.replace(/_/g, '');
    const dest = `boilerplate/python/migrations/versions/${revision}_${migrationName}.py`;

    const content = `"""${migrationName}

Revision ID: ${revision}
Revises: 
Create Date: ${new Date().toISOString()}

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '${revision}'
down_revision = None  # Set to previous revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Create ${tableName} table
    op.create_table(
        '${tableName}',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        
        # Add domain-specific columns here
        # sa.Column('name', sa.String(length=255), nullable=False),
        # sa.Column('amount', sa.Numeric(precision=19, scale=4), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('created_at <= updated_at', name=f'chk_{tableName}_created_at')
    )
    
    # Create indexes
    op.create_index(op.f('ix_${tableName}_created_at'), '${tableName}', ['created_at'], unique=False)
    op.create_index(op.f('ix_${tableName}_updated_at'), '${tableName}', ['updated_at'], unique=False)
    
    # Add table comment
    op.execute(f"COMMENT ON TABLE ${tableName} IS '${migrationNameCamel} aggregate root table'")
    op.execute(f"COMMENT ON COLUMN ${tableName}.id IS 'Unique identifier'")
    op.execute(f"COMMENT ON COLUMN ${tableName}.created_at IS 'Record creation timestamp'")
    op.execute(f"COMMENT ON COLUMN ${tableName}.updated_at IS 'Record last update timestamp'")


def downgrade() -> None:
    """Downgrade database schema."""
    # Drop indexes
    op.drop_index(op.f('ix_${tableName}_updated_at'), table_name='${tableName}')
    op.drop_index(op.f('ix_${tableName}_created_at'), table_name='${tableName}')
    
    # Drop table
    op.drop_table('${tableName}')
`;

    this.fs.write(dest, content);
    this.log(chalk.green(`  create ${dest}`));
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

  _generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  end() {
    this.log(chalk.green('\n✅ Migration created successfully!'));
    this.log(chalk.blue('\n📝 Next steps:'));
    this.log(`  1. Review and customize the migration in boilerplate/${this.answers.stack}/`);
    this.log(`  2. Add domain-specific columns`);
    this.log(`  3. Set down_revision (Python) or verify version (Java)`);
    this.log(`  4. Run: ${this.answers.stack === 'java' ? './mvn flyway:migrate' : 'alembic upgrade head'}`);
  }
};
