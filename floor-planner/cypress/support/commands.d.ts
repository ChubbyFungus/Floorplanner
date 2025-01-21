/**
 * commands.d.ts
 * -------------
 * Fixes TypeScript error "Property 'stub' does not exist on type 'Chainable'".
 *
 * 1. Place this file in cypress/support/commands.d.ts (or another .d.ts file in cypress).
 * 2. Ensure "include" in tsconfig.json covers "cypress/support/*.d.ts" so TypeScript can see it.
 * 3. Now you can safely use `cy.stub(win, 'confirm')` in your tests without TS errors.
 */

/// <reference types="cypress" />
/// <reference types="sinon" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Provide a stub method that matches Sinon’s signature, e.g.:
     *    cy.window().then((win) => {
     *      cy.stub(win, 'confirm').returns(true);
     *    });
     */
    stub(...args: any[]): Chainable<sinon.SinonStub>;
  }
}