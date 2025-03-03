// Debug script to check entity imports
import * as entities from './entities';

console.log('Loaded entities:', Object.keys(entities));

// Check for circular imports
const circularCheck = new Set<string>();
const checkImports = (entityName: string) => {
  if (circularCheck.has(entityName)) {
    console.error(`Circular import detected: ${entityName}`);
    return;
  }
  
  circularCheck.add(entityName);
  console.log(`Checking entity: ${entityName}`);
};

// Check each entity
for (const entityName of Object.keys(entities)) {
  console.log(`\nChecking ${entityName}:`);
  circularCheck.clear();
  checkImports(entityName);
}