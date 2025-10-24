/**
 * SmartMutator Wrapper - Handles optional Stryker dependency
 * 
 * This wrapper provides a graceful way to handle the optional Stryker dependencies
 * for mutation testing, making SyntroJS easier to install and use for basic cases.
 */

export interface SmartMutatorOptions {
  mode?: 'smart' | 'full';
  strykerConfigFile?: string;
}

export interface MutationReport {
  totalMutants: number;
  killed: number;
  survived: number;
  mutationScore: number;
  executionTime: number;
  mode: 'smart' | 'full';
}

export class SmartMutatorWrapper {
  /**
   * Checks if Stryker dependencies are available
   */
  private static async checkStrykerAvailability(): Promise<boolean> {
    try {
      await import('@stryker-mutator/core');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Runs mutation testing with graceful fallback if dependencies are missing
   * 
   * @param options - Configuration options for SmartMutator
   * @returns Promise<MutationReport | undefined> - undefined if dependencies missing
   */
  static async run(options: SmartMutatorOptions = {}): Promise<MutationReport | undefined> {
    const { mode = 'smart' } = options;
    
    const isAvailable = await this.checkStrykerAvailability();
    
    if (!isAvailable) {
      console.warn(`
⚠️  SmartMutator requires Stryker dependencies:
   npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
   
   Or run: npm install syntrojs --include=optional
   
   For more info: https://github.com/Syntropysoft/sintrojs#optional-dependencies
      `);
      return undefined;
    }

    // Import and use SmartMutator
    const { SmartMutator } = await import('./SmartMutator');
    return SmartMutator.run(options);
  }

  /**
   * Checks if SmartMutator is available without running it
   */
  static async isAvailable(): Promise<boolean> {
    return this.checkStrykerAvailability();
  }
}
