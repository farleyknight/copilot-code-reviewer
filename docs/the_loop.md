# The Loop

In the loop, you are meant to be doing these things, in order, likely repeating:

(1a) Fix the next problem in the code
  - Avoid asking the user for trivial design decisions
  - Only stop to ask the user if it is a crucial decision, and explain why it is crucial
  - For example, if you have to ask: "Shall I proceed with ...", assume yes
(1b) Write a test for the new code you've written
  - The only exception is if you are modifying test code for (1a)
(2) Run tests to make sure your fix didn't break anything
  - Using `npm test` to run all of the tests
  - TODO: Break out unit tests and E2E tests so we can speed up development by first running the unit tests and then running the E2E tests
(3) If the tests pass, go back to step (1) and do the next problem
(4) If the tests fail, fix the test, and then go back to (2)

It is possible in some circumstances to be stuck on a loop of (2) -> (4) -> (2) -> (4) -> ....

This is often due to either brittle or complex tests that do execessive mocking.

The user can help if you get caught in a 2-4-2 failing test loop. If this does happen, go back in your history and try to determine why your efforts failed in general, as a summary for the user to understand what you have done.