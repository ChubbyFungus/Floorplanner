/// <reference types="cypress" />

      /**
       * floorPlannerE2E.spec.ts
       * -----------------------
       * End-to-end tests for verifying core functionality of the Floor Planner application.
       *
       * Prerequisites:
       * - The app should be running locally at http://localhost:3000 (or update the baseUrl in cypress.config).
       *
       * Usage:
       * - Run "npm run cypress:open" or "npm run cypress:run".
       */

      describe("Floor Planner E2E", () => {
        beforeEach(() => {
          // Visit your local dev server; change URL if needed.
          cy.visit("/");
        });

        it("Loads the main floor planner page", () => {
          cy.get("h6")
            .contains("Your Floor Plan Summary")
            .should("be.visible");
        });

        it("Shows and hides the grid", () => {
          // Initially grid is on, check canvas or background
          // Toggling the grid button
          cy.contains("button", "Hide Grid").should("exist").click();
          // Confirm that toggling changes the button label or state
          cy.contains("button", "Show Grid").should("exist");
          // Toggle back
          cy.contains("button", "Show Grid").click();
          cy.contains("button", "Hide Grid").should("exist");
        });

        it("Enables and disables snap-to-grid", () => {
          // Snap is initially enabled
          cy.contains("button", "Enable Grid Snap").should("not.exist");
          cy.contains("button", "Disable Grid Snap")
            .should("exist")
            .click();
          cy.contains("button", "Enable Grid Snap").should("exist");
          // Re-enable snap
          cy.contains("button", "Enable Grid Snap").click();
          cy.contains("button", "Disable Grid Snap").should("exist");
        });

        it("Draws a straight wall in 2D mode", () => {
          // Select the Wall Tool
          cy.get("button").contains("Wall Tool").click();
          // Canvas might be found by a selector—adjust if needed
          cy.get("canvas")
            .trigger("mousedown", { clientX: 150, clientY: 150 })
            .trigger("mouseup")
            .trigger("mousedown", { clientX: 250, clientY: 150 })
            .trigger("mouseup");

          // Deselect the tool (click "Wall Tool" again or click "Select Tool")
          cy.get("button").contains("Wall Tool").click();

          // Check summary or the properties panel for the new wall
          cy.get("body").then(($body) => {
            // If properties panel might show new wall info, confirm it
            if ($body.find('[aria-label="Properties"]').length) {
              // Implementation detail: depends on how your "PropertiesPanel" is structured
              cy.get('[aria-label="Properties"]').should("contain.text", "Selected Wall");
            }
          });
        });

        it("Draws a rectangular room", () => {
          // Switch to the Room Tool
          cy.get("button").contains("Room Tool").click();

          // Create a small rectangle on the canvas
          cy.get("canvas")
            .trigger("mousedown", { clientX: 200, clientY: 200 })
            .trigger("mouseup")
            .trigger("mousemove", { clientX: 300, clientY: 300 })
            .trigger("mousedown", { clientX: 300, clientY: 300 })
            .trigger("mouseup");

          // We can check if the "Your Floor Plan Summary" updates or if there's any new room data
          cy.contains("Room Tool").click(); // Deselect
        });

        it("Toggles measurements and uses tape measure", () => {
          // Toggle measurements
          cy.contains("button", "Show Measurements").click();
          cy.contains("button", "Hide Measurements").should("exist");

          // Use tape measure
          cy.contains("button", "Tape Measure").click();
          // If the tape measure changes the UI, test it
          cy.get("canvas")
            .click(400, 200)
            .click(500, 200);

          // Check that some measurement label appears (optional)
          // This depends on your measurement label rendering method
          // e.g., check for an element with text matching a foot/inch pattern
          // 
          // Turn off tape measure
          cy.contains("button", "Tape Measure").click();
        });

        it("Switches between 2D and 3D views", () => {
          // Initially in 2D
          cy.contains("2D Floor Planner").should("exist");

          // Switch to 3D
          cy.get("button").contains("ThreeDRotationIcon").click(); // or use the tooltip text
          cy.contains("3D Visualization").should("exist");

          // Switch back to 2D
          cy.get("button").contains("ThreeDRotationIcon").click();
          cy.contains("2D Floor Planner").should("exist");
        });

        it("Tests undo and redo functionality", () => {
          // Draw a quick wall
          cy.get("button").contains("Wall Tool").click();
          cy.get("canvas")
            .trigger("mousedown", { clientX: 150, clientY: 150 })
            .trigger("mouseup")
            .trigger("mousedown", { clientX: 200, clientY: 150 })
            .trigger("mouseup");
          cy.get("button").contains("Wall Tool").click();

          // Undo
          cy.get("button").contains("Undo").click();
          // Redo
          cy.get("button").contains("Redo").click();
        });

        it("Tests AI tips panel open/close", () => {
          // Toggle AI tips
          cy.contains("button", "AI Design Tips").click();
          cy.get("h6").contains("AI Design Tips").should("be.visible");
          // Wait a moment for tips to load
          cy.wait(1500);
          // Check that tips are loaded
          cy.contains("Add more clearance around the island.").should("exist");
          // Close AI tips
          cy.contains("button", "AI Design Tips").click();
          cy.get("h6").contains("AI Design Tips").should("not.exist");
        });

        it("Clears the canvas with confirmation", () => {
          // Confirm that a dialog/alert is shown
          cy.window().then((win) => {
            cy.stub(win, "confirm").returns(true);
          });
          cy.get("button").contains("Clear Canvas").click();

          // If undone, the canvas should be empty, no walls or rooms
          // e.g., check if the summary says total area 0
          cy.contains("Total Area: 0").should("exist");
        });
      });