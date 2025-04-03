# NotionActions Integration Tests

This directory contains integration tests for the NotionActions defined in `../notion.ts`.

## Overview

The tests verify that all NotionActions work correctly by:

1. Mocking the Notion SDK client
2. Testing each action with appropriate input parameters
3. Verifying the output is as expected
4. Testing error handling

## Test Structure

- `notion.integration.test.ts`: Tests for all NotionActions

The tests are organized by action type:

- Block Actions
- Database Actions
- Page Actions
- User Actions
- Comment Actions
- Search Action
- OAuth Actions
- Error Handling

## Running Tests

To run the tests:

```bash
# From the api-server directory
npm test
```

## Adding New Tests

When adding new NotionActions to the `notion.ts` file, remember to:

1. Add a corresponding mock in the `jest.mock('@notionhq/client', ...)` section
2. Add tests for the new action in the appropriate section
3. Test both successful execution and error handling

## Test Utilities

The `testNotionAction` helper function is used to test each action with its input parameters:

```typescript
const testNotionAction = async (actionName: string, input: any) => {
  const action = getNotionAction(actionName);
  expect(action).toBeDefined();

  if (!action) return; // To satisfy TypeScript

  // Execute the action with the provided input
  const result = await action.execute(input);
  expect(result).toBeDefined();
};
```
