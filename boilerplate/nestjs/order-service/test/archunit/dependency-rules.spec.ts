// test/archunit/dependency-rules.spec.ts
import { execSync } from 'child_process';
import * as path from 'path';

describe('Architecture — Dependency Cruiser', () => {
  const projectRoot = path.join(__dirname, '../..');

  it('should have no forbidden layer violations', () => {
    expect(() => {
      execSync(
        'npx depcruise --validate .dependency-cruiser.cjs src/',
        {
          cwd: projectRoot,
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
    }).not.toThrow();
  });
});
