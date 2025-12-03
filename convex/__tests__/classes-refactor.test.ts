import { describe, expect, it } from 'vitest';

/**
 * Test Suite: Verify Classes Refactoring Structure
 * 
 * This test validates that the classes.ts file has been successfully
 * refactored into modular components while maintaining backward compatibility.
 */
describe('Classes Module Refactoring', () => {
  it('should export all functions from the main classes module', async () => {
    // Import from the backward-compatible main classes module
    const classesModule = await import('../classes');
    
    // Verify query functions are exported (they are Convex query objects or functions)
    const queryFunctions = [
      'list',
      'getById',
      'getByDateRange',
      'listWithDetails',
      'checkTimeConflicts',
      'getEditAnalytics',
      'getUpcomingForNotification',
      'findRecurringSeries',
      'findUnpopulatedClasses',
    ];
    
    for (const funcName of queryFunctions) {
      expect(classesModule).toHaveProperty(funcName);
      const exported = classesModule[funcName as keyof typeof classesModule];
      // Convex functions can be either objects or functions
      expect(['object', 'function']).toContain(typeof exported);
    }
    
    // Verify mutation functions are exported (they are Convex mutation objects or functions)
    const mutationFunctions = [
      'bookWithConflictCheck',
      'book',
      'acknowledge',
      'approve',
      'reject',
      'updateClass',
      'deleteClass',
      'editClass',
      'addDatesToClass',
      'addStudentToClass',
      'removeStudentFromClass',
      'mergeClasses',
      'bulkDeleteClasses',
      'bulkApprove',
      'deleteRecurringSeries',
      'cleanUpUnpopulatedClasses',
    ];
    
    for (const funcName of mutationFunctions) {
      expect(classesModule).toHaveProperty(funcName);
      const exported = classesModule[funcName as keyof typeof classesModule];
      // Convex functions can be either objects or functions
      expect(['object', 'function']).toContain(typeof exported);
    }
    
    // Verify helper function is exported
    expect(classesModule).toHaveProperty('verifyClassAccess');
    expect(typeof classesModule.verifyClassAccess).toBe('function');
  });

  it('should export query functions from classes/queries module', async () => {
    const queriesModule = await import('../classes/queries');
    
    expect(queriesModule).toHaveProperty('list');
    expect(queriesModule).toHaveProperty('getById');
    expect(queriesModule).toHaveProperty('getByDateRange');
    expect(queriesModule).toHaveProperty('listWithDetails');
    expect(queriesModule).toHaveProperty('checkTimeConflicts');
    expect(queriesModule).toHaveProperty('getEditAnalytics');
    expect(queriesModule).toHaveProperty('getUpcomingForNotification');
    expect(queriesModule).toHaveProperty('findRecurringSeries');
    expect(queriesModule).toHaveProperty('findUnpopulatedClasses');
  });

  it('should export mutation functions from classes/mutations module', async () => {
    const mutationsModule = await import('../classes/mutations');
    
    expect(mutationsModule).toHaveProperty('bookWithConflictCheck');
    expect(mutationsModule).toHaveProperty('book');
    expect(mutationsModule).toHaveProperty('acknowledge');
    expect(mutationsModule).toHaveProperty('approve');
    expect(mutationsModule).toHaveProperty('reject');
    expect(mutationsModule).toHaveProperty('updateClass');
    expect(mutationsModule).toHaveProperty('deleteClass');
    expect(mutationsModule).toHaveProperty('editClass');
    expect(mutationsModule).toHaveProperty('addDatesToClass');
    expect(mutationsModule).toHaveProperty('addStudentToClass');
    expect(mutationsModule).toHaveProperty('removeStudentFromClass');
    expect(mutationsModule).toHaveProperty('mergeClasses');
    expect(mutationsModule).toHaveProperty('bulkDeleteClasses');
    expect(mutationsModule).toHaveProperty('bulkApprove');
    expect(mutationsModule).toHaveProperty('deleteRecurringSeries');
    expect(mutationsModule).toHaveProperty('cleanUpUnpopulatedClasses');
  });

  it('should export helper functions from classes/helpers module', async () => {
    const helpersModule = await import('../classes/helpers');
    
    expect(helpersModule).toHaveProperty('verifyClassAccess');
    expect(typeof helpersModule.verifyClassAccess).toBe('function');
  });

  it('should have index module that re-exports everything', async () => {
    const indexModule = await import('../classes/index');
    
    // Should have all query functions
    expect(indexModule).toHaveProperty('list');
    expect(indexModule).toHaveProperty('getById');
    
    // Should have all mutation functions
    expect(indexModule).toHaveProperty('book');
    expect(indexModule).toHaveProperty('approve');
    
    // Should have helper functions
    expect(indexModule).toHaveProperty('verifyClassAccess');
  });
});
